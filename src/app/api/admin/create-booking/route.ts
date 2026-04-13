import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminPermission } from '@/lib/adminAuth';
import { provisionNukiKeypadCode } from '@/lib/nuki';
import { type Slot, type Room } from '@/lib/constants';
import { isSlotAvailableWithGlobalExclusion } from '@/lib/availability';

const VALID_SLOTS: Slot[] = ['morning', 'afternoon', 'fullday'];
const VALID_ROOMS: Room[] = ['room1', 'room2', 'large'];

const isUniqueViolation = (error: { code?: string } | null) => error?.code === '23505';

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

    // Vérification de la disponibilité (règle unique: exclusion globale)
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('slot, room')
      .eq('date', date)
      .eq('status', 'confirmed');

    const isAvailable = isSlotAvailableWithGlobalExclusion(existingBookings || [], slot);

    if (!isAvailable) {
      return NextResponse.json({ error: 'Ce créneau n\'est pas disponible' }, { status: 409 });
    }

    // Insérer la réservation avant de provisionner Nuki pour éviter les codes gaspillés
    // lors des requêtes concurrentes qui finissent en conflit.
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        date,
        slot,
        room,
        price,
        status: 'confirmed',
        access_code: null,
        nuki_auth_id: null,
        nuki_code_status: 'none',
      })
      .select('id')
      .single();

    if (insertError) {
      if (isUniqueViolation(insertError)) {
        return NextResponse.json(
          { error: 'Ce créneau est déjà réservé pour cette salle' },
          { status: 409 }
        );
      }

      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Erreur lors de la création : ' + insertError.message }, { status: 500 });
    }

    // Générer le code Nuki uniquement après création de la réservation
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

    const { error: nukiUpdateError } = await supabase
      .from('bookings')
      .update({
        access_code: accessCode,
        nuki_auth_id: nukiAuthId,
        nuki_code_status: nukiCodeStatus,
      })
      .eq('id', booking.id);

    if (nukiUpdateError) {
      console.error('Nuki update error:', nukiUpdateError);
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
