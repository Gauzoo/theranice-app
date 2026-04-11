import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deleteNukiKeypadCode, findNukiAuthIdByAccessCode } from '@/lib/nuki';
import { SLOT_END_HOURS, type Slot } from '@/lib/constants';

export async function GET(request: Request) {
  try {
    // Vérifie l'authentification : Bearer token OU header Vercel cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isVercelCron = request.headers.get('x-vercel-cron-auth-token') === cronSecret;
    const isBearerAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;
    
    if (!cronSecret || (!isVercelCron && !isBearerAuth)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Utilise le service role pour accéder à toutes les réservations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Heure actuelle en France (Europe/Paris)
    const now = new Date();
    const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const todayStr = parisTime.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentHour = parisTime.getHours();

    // Récupère TOUTES les réservations avec un code Nuki actif
    // qui sont potentiellement expirées
    const { data: activeBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, date, slot, nuki_auth_id, nuki_code_status, access_code')
      .in('nuki_code_status', ['active', 'revoke_failed'])
      .lte('date', todayStr); // date ≤ aujourd'hui

    if (fetchError) {
      console.error('Erreur récupération réservations:', fetchError);
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 });
    }

    if (!activeBookings || activeBookings.length === 0) {
      return NextResponse.json({ message: 'Aucun code à révoquer', revoked: 0 });
    }

    // Filtre les réservations dont le créneau est expiré
    const expiredBookings = activeBookings.filter(booking => {
      // Si la date est avant aujourd'hui → le créneau est forcément terminé
      if (booking.date < todayStr) return true;
      
      // Si c'est aujourd'hui, vérifie l'heure de fin du créneau
      if (booking.date === todayStr) {
        const slotEndHour = SLOT_END_HOURS[booking.slot as Slot] || 18;
        return currentHour >= slotEndHour;
      }
      
      return false;
    });

    if (expiredBookings.length === 0) {
      return NextResponse.json({ message: 'Aucun code expiré à révoquer', revoked: 0 });
    }

    console.log(`[Cron Nuki] ${expiredBookings.length} code(s) à révoquer (heure Paris: ${currentHour}h)`);

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const booking of expiredBookings) {
      let nukiAuthId = booking.nuki_auth_id as string | null;

      if (!nukiAuthId && booking.access_code) {
        nukiAuthId = await findNukiAuthIdByAccessCode(booking.access_code);
      }

      if (!nukiAuthId) {
        await supabase
          .from('bookings')
          .update({ nuki_code_status: 'revoke_failed' })
          .eq('id', booking.id);

        results.push({
          id: booking.id,
          success: false,
          error: 'nuki_auth_id introuvable pour cette réservation',
        });
        continue;
      }

      try {
        const revoked = await deleteNukiKeypadCode(nukiAuthId);
        if (!revoked) {
          throw new Error('Suppression Nuki non confirmée');
        }
        
        // Met à jour le statut du code
        await supabase
          .from('bookings')
          .update({ nuki_code_status: 'revoked', nuki_auth_id: nukiAuthId })
          .eq('id', booking.id);

        results.push({ id: booking.id, success: true });
        console.log(`[Cron Nuki] Code révoqué: réservation ${booking.id} (date: ${booking.date}, slot: ${booking.slot})`);
      } catch (err) {
        console.error(`[Cron Nuki] Erreur révocation ${booking.id}:`, err);
        
        // Marque l'échec mais ne bloque pas les autres
        await supabase
          .from('bookings')
          .update({ nuki_code_status: 'revoke_failed', nuki_auth_id: nukiAuthId })
          .eq('id', booking.id);

        results.push({ 
          id: booking.id, 
          success: false, 
          error: err instanceof Error ? err.message : 'Erreur inconnue' 
        });
      }
    }

    const revokedCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return NextResponse.json({ 
      message: `${revokedCount} code(s) révoqué(s), ${failedCount} échec(s)`,
      revoked: revokedCount,
      failed: failedCount,
      details: results,
    });
  } catch (err) {
    console.error('Cleanup cron error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
