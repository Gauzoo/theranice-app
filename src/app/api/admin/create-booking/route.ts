import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminPermission } from '@/lib/adminAuth';
import { provisionNukiKeypadCode } from '@/lib/nuki';
import { type Slot, type Room } from '@/lib/constants';

const VALID_SLOTS: Slot[] = ['morning', 'afternoon', 'fullday'];
const VALID_ROOMS: Room[] = ['room1', 'room2', 'large'];

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { userId, date, slot, room, price } = await request.json();

    if (!userId || !date || !slot || !room || price == null) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    if (!VALID_SLOTS.includes(slot)) {
      return NextResponse.json({ error: 'Créneau invalide' }, { status: 400 });
    }

    if (!VALID_ROOMS.includes(room)) {
      return NextResponse.json({ error: 'Salle invalide' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Vérification de la disponibilité
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('slot, room')
      .eq('date', date)
      .eq('status', 'confirmed');

    let isAvailable = true;
    const bookings = existingBookings || [];

    if (slot === 'fullday') {
      if (room === 'large') {
        isAvailable = bookings.length === 0;
      } else {
        const roomBooked = bookings.some((b: { room: string }) => b.room === room);
        const largeBooked = bookings.some((b: { room: string }) => b.room === 'large');
        isAvailable = !roomBooked && !largeBooked;
      }
    } else {
      const fulldayBooked = bookings.some((b: { slot: string; room: string }) => b.slot === 'fullday' && b.room === room);
      const largeFulldayBooked = bookings.some((b: { slot: string; room: string }) => b.slot === 'fullday' && b.room === 'large');

      if (fulldayBooked || largeFulldayBooked) {
        isAvailable = false;
      } else {
        const bookingsForSlot = bookings.filter((b: { slot: string }) => b.slot === slot);
        if (room === 'large') {
          isAvailable = bookingsForSlot.length === 0;
        } else {
          const roomBooked = bookingsForSlot.some((b: { room: string }) => b.room === room);
          const largeBooked = bookingsForSlot.some((b: { room: string }) => b.room === 'large');
          isAvailable = !roomBooked && !largeBooked;
        }
      }
    }

    if (!isAvailable) {
      return NextResponse.json({ error: 'Ce créneau n\'est pas disponible' }, { status: 409 });
    }

    // Générer le code Nuki
    let accessCode: string | null = null;
    let nukiAuthId: string | null = null;
    let nukiCodeStatus = 'none';

    try {
      const authName = `Admin ${date} ${slot}`;

      const nukiResult = await provisionNukiKeypadCode(
        supabase,
        authName,
        date,
        slot
      );

      if (nukiResult.success && nukiResult.code != null) {
        accessCode = String(nukiResult.code);
        nukiAuthId = nukiResult.authId || null;
        nukiCodeStatus = 'active';
        console.log(`[Admin] Nuki code created for ${date} ${slot} ${room} (${nukiResult.attempts} attempt(s))`);
      } else {
        console.error(`[Admin] Nuki code creation failed:`, nukiResult.error);
        if (nukiResult.code != null) {
          accessCode = String(nukiResult.code);
        }
        nukiCodeStatus = 'error';
      }
    } catch (nukiError) {
      console.error('[Admin] Nuki unexpected error:', nukiError);
      nukiCodeStatus = 'error';
    }

    // Insérer la réservation
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        date,
        slot,
        room,
        price,
        status: 'confirmed',
        access_code: accessCode,
        nuki_auth_id: nukiAuthId,
        nuki_code_status: nukiCodeStatus,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Erreur lors de la création : ' + insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      accessCode,
      nukiCodeStatus,
    });
  } catch (err) {
    console.error('Create booking error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
