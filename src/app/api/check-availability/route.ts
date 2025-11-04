import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { date, slot, room } = await request.json();

    // Utilise la service role key pour bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupère toutes les réservations confirmées pour cette date
    const { data: bookingsForDate, error } = await supabase
      .from('bookings')
      .select('slot, room')
      .eq('date', date)
      .eq('status', 'confirmed');

    if (error) {
      console.error('Error checking availability:', error);
      return NextResponse.json({ available: false, error: error.message }, { status: 500 });
    }

    // Si on veut réserver la journée complète
    if (slot === 'fullday') {
      if (room === 'large') {
        // Grande salle journée : aucune réservation ne doit exister
        const available = bookingsForDate.length === 0;
        return NextResponse.json({ available });
      } else {
        // Petite salle journée : cette salle ET la grande salle ne doivent pas être réservées
        const roomBookedAnytime = bookingsForDate.some(b => b.room === room);
        const largeBookedAnytime = bookingsForDate.some(b => b.room === 'large');
        const available = !roomBookedAnytime && !largeBookedAnytime;
        return NextResponse.json({ available });
      }
    }

    // Si on veut réserver matin ou après-midi
    // Vérifie s'il y a une réservation journée sur cette salle
    const fulldayBooked = bookingsForDate.some(b => b.slot === 'fullday' && b.room === room);
    if (fulldayBooked) {
      return NextResponse.json({ available: false });
    }

    // Vérifie si la grande salle est réservée en journée complète
    const largeFulldayBooked = bookingsForDate.some(b => b.slot === 'fullday' && b.room === 'large');
    if (largeFulldayBooked) {
      return NextResponse.json({ available: false });
    }

    // Vérifie les réservations pour ce créneau spécifique
    const bookingsForSlot = bookingsForDate.filter(b => b.slot === slot);

    if (room === 'large') {
      // Grande salle : aucune autre salle ne doit être réservée pour ce créneau
      const available = bookingsForSlot.length === 0;
      return NextResponse.json({ available });
    } else {
      // Petite salle : elle ne doit pas être réservée ET la grande salle ne doit pas être réservée
      const roomBooked = bookingsForSlot.some(b => b.room === room);
      const largeBooked = bookingsForSlot.some(b => b.room === 'large');
      const available = !roomBooked && !largeBooked;
      return NextResponse.json({ available });
    }

  } catch (err) {
    console.error('Availability check error:', err);
    return NextResponse.json({ available: false, error: 'Server error' }, { status: 500 });
  }
}
