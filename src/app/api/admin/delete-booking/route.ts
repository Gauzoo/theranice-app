import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { deleteNukiKeypadCode, findNukiAuthIdByAccessCode } from '@/lib/nuki';
import { checkAdminPermission } from '@/lib/adminAuth';

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 });
    }

    const supabaseAdmin = createSupabaseClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId requis' }, { status: 400 });
    }

    // Récupère la réservation pour vérifier le code Nuki
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, nuki_auth_id, nuki_code_status, access_code')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    // Révoque le code Nuki si actif
    let nukiAuthId = booking.nuki_auth_id as string | null;

    if (!nukiAuthId && booking.nuki_code_status === 'active' && booking.access_code) {
      nukiAuthId = await findNukiAuthIdByAccessCode(booking.access_code);
      if (nukiAuthId) {
        console.log(`Auth ID Nuki résolu via access_code pour réservation supprimée ${bookingId}`);
      }
    }

    if (nukiAuthId && booking.nuki_code_status === 'active') {
      try {
        const revoked = await deleteNukiKeypadCode(nukiAuthId);
        if (revoked) {
          console.log(`Code Nuki révoqué pour la réservation supprimée ${bookingId}`);
        } else {
          console.error(`Révocation Nuki non confirmée pour réservation ${bookingId}`);
        }
      } catch (nukiError) {
        console.error(`Erreur révocation code Nuki pour réservation ${bookingId}:`, nukiError);
        // On continue la suppression
      }
    }

    // Supprime la réservation
    const { data: deletedRows, error: deleteError } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('id', bookingId)
      .select('id');

    if (deleteError) {
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    if (!deletedRows || deletedRows.length === 0) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete booking error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
