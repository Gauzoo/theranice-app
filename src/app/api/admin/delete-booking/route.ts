import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteNukiKeypadCode } from '@/lib/nuki';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifie que l'utilisateur est admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.email !== 'gauthier.guerin@gmail.com') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId requis' }, { status: 400 });
    }

    // Récupère la réservation pour vérifier le code Nuki
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, nuki_auth_id, nuki_code_status')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    // Révoque le code Nuki si actif
    if (booking.nuki_auth_id && booking.nuki_code_status === 'active') {
      try {
        await deleteNukiKeypadCode(booking.nuki_auth_id);
        console.log(`Code Nuki révoqué pour la réservation supprimée ${bookingId}`);
      } catch (nukiError) {
        console.error(`Erreur révocation code Nuki pour réservation ${bookingId}:`, nukiError);
        // On continue la suppression
      }
    }

    // Supprime la réservation
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (deleteError) {
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete booking error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
