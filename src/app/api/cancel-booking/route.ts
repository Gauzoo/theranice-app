import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteNukiKeypadCode, findNukiAuthIdByAccessCode } from '@/lib/nuki';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifie que l'utilisateur est authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId requis' }, { status: 400 });
    }

    // Récupère la réservation avec les infos Nuki
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, user_id, status, nuki_auth_id, nuki_code_status, date, slot, room, access_code')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    // Vérifie que l'utilisateur est le propriétaire OU admin
    const isAdmin = user.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;
    if (booking.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Vérifie que la réservation peut être annulée
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Réservation déjà annulée' }, { status: 400 });
    }

    // Vérifie le délai d'annulation (14 jours) - sauf pour l'admin
    if (!isAdmin) {
      const bookingDate = new Date(booking.date + 'T00:00:00');
      const now = new Date();
      const daysDiff = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 14) {
        return NextResponse.json({ error: 'Annulation impossible : moins de 14 jours avant la réservation' }, { status: 400 });
      }
    }

    // Révoque le code Nuki si actif
    let nukiRevoked = false;
    let nukiAuthId = booking.nuki_auth_id as string | null;

    if (!nukiAuthId && booking.nuki_code_status === 'active' && booking.access_code) {
      nukiAuthId = await findNukiAuthIdByAccessCode(booking.access_code);
      if (nukiAuthId) {
        console.log(`Auth ID Nuki résolu via access_code pour réservation ${booking.id.substring(0, 8)}...`);
      }
    }

    if (nukiAuthId && booking.nuki_code_status === 'active') {
      try {
        const revoked = await deleteNukiKeypadCode(nukiAuthId);
        if (revoked) {
          nukiRevoked = true;
          console.log(`Code Nuki révoqué pour la réservation ${booking.id.substring(0, 8)}...`);
        } else {
          console.error(`Révocation Nuki non confirmée pour la réservation ${booking.id.substring(0, 8)}...`);
        }
      } catch (nukiError) {
        console.error(`Erreur révocation code Nuki pour réservation ${booking.id.substring(0, 8)}...:`, nukiError);
        // On continue l'annulation même si le code Nuki n'a pas pu être révoqué
      }
    }

    // Met à jour le statut de la réservation avec audit trail
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        nuki_auth_id: nukiAuthId ?? booking.nuki_auth_id,
        nuki_code_status: nukiRevoked ? 'revoked' : booking.nuki_code_status === 'active' ? 'revoke_failed' : booking.nuki_code_status,
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
      })
      .eq('id', bookingId);

    if (updateError) {
      return NextResponse.json({ error: 'Erreur lors de l\'annulation' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      nukiRevoked,
      booking: {
        id: booking.id,
        date: booking.date,
        slot: booking.slot,
        room: booking.room,
      }
    });
  } catch (err) {
    console.error('Cancel booking error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
