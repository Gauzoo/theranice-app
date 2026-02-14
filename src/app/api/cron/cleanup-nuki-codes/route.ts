import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deleteNukiKeypadCode } from '@/lib/nuki';

// Cette route peut être appelée par un cron job (ex: Vercel Cron)
// pour révoquer les codes Nuki des réservations expirées.
// Protégée par un secret dans l'en-tête Authorization.

export async function POST(request: Request) {
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

    // Récupère toutes les réservations avec un code Nuki actif dont la date est passée
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const { data: expiredBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, date, nuki_auth_id, nuki_code_status, access_code')
      .eq('nuki_code_status', 'active')
      .lt('date', today) // date strictement antérieure à aujourd'hui
      .not('nuki_auth_id', 'is', null);

    if (fetchError) {
      console.error('Erreur récupération réservations expirées:', fetchError);
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 });
    }

    if (!expiredBookings || expiredBookings.length === 0) {
      return NextResponse.json({ message: 'Aucun code à révoquer', revoked: 0 });
    }

    console.log(`${expiredBookings.length} code(s) Nuki à révoquer`);

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
        console.log(`Code Nuki révoqué pour réservation ${booking.id} (date: ${booking.date})`);
      } catch (err) {
        console.error(`Erreur révocation code pour réservation ${booking.id}:`, err);
        
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
