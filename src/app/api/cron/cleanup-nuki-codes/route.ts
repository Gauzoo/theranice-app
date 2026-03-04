import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deleteNukiKeypadCode } from '@/lib/nuki';

// Cette route est appelée par Vercel Cron toutes les heures.
// Elle révoque les codes Nuki des réservations dont le créneau est terminé.
// Puisque l'abonnement Nuki B2C INACTIVE ne supporte pas les restrictions
// temporelles natives (allowedFromDate, allowedUntilDate, etc. sont ignorés),
// cette suppression logicielle est le seul moyen de limiter la validité des codes.

// Heure de fin par créneau (avec 30 min de marge)
const SLOT_END_HOURS: Record<string, number> = {
  morning: 13,    // matin finit à 12h → on révoque à 13h
  afternoon: 18,  // après-midi finit à 17h → on révoque à 18h
  fullday: 18,    // journée finit à 17h → on révoque à 18h
};

export async function GET(request: Request) {
  try {
    // Vérifie le secret d'authentification pour le cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
      .eq('nuki_code_status', 'active')
      .lte('date', todayStr) // date ≤ aujourd'hui
      .not('nuki_auth_id', 'is', null);

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
        const slotEndHour = SLOT_END_HOURS[booking.slot] || 18;
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
      try {
        await deleteNukiKeypadCode(booking.nuki_auth_id!);
        
        // Met à jour le statut du code
        await supabase
          .from('bookings')
          .update({ nuki_code_status: 'revoked' })
          .eq('id', booking.id);

        results.push({ id: booking.id, success: true });
        console.log(`[Cron Nuki] Code révoqué: réservation ${booking.id} (date: ${booking.date}, slot: ${booking.slot})`);
      } catch (err) {
        console.error(`[Cron Nuki] Erreur révocation ${booking.id}:`, err);
        
        // Marque l'échec mais ne bloque pas les autres
        await supabase
          .from('bookings')
          .update({ nuki_code_status: 'revoke_failed' })
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
