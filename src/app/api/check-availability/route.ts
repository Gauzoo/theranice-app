import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PENDING_PAYMENT_TTL_MINUTES, type Slot } from '@/lib/constants';
import { isSlotAvailableWithGlobalExclusion } from '@/lib/availability';

type AvailabilityRow = {
  slot: string;
  status: string;
  created_at: string | null;
};

function isPendingPaymentActive(createdAt: string | null | undefined, pendingCutoffMs: number): boolean {
  if (!createdAt) {
    return true;
  }

  const parsed = Date.parse(createdAt);
  if (Number.isNaN(parsed)) {
    return true;
  }

  return parsed >= pendingCutoffMs;
}

export async function POST(request: NextRequest) {
  try {
    const { date, slot, room: _room } = await request.json();

    if (!date || !slot || !_room) {
      return NextResponse.json({ available: false, error: 'Paramètres manquants' }, { status: 400 });
    }

    // Utilise la service role key côté serveur uniquement (jamais exposée au client)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const pendingCutoffMs = Date.now() - (PENDING_PAYMENT_TTL_MINUTES * 60 * 1000);

    // Récupère les réservations bloquantes pour cette date
    const { data: bookingsForDate, error } = await supabase
      .from('bookings')
      .select('slot, status, created_at')
      .eq('date', date)
      .in('status', ['confirmed', 'pending_payment']);

    if (error) {
      console.error('Error checking availability:', error);
      return NextResponse.json({ available: false, error: error.message }, { status: 500 });
    }

    const blockingBookings = ((bookingsForDate || []) as AvailabilityRow[]).filter((booking) => {
      if (booking.status === 'confirmed') {
        return true;
      }

      if (booking.status === 'pending_payment') {
        return isPendingPaymentActive(booking.created_at, pendingCutoffMs);
      }

      return false;
    });

    const available = isSlotAvailableWithGlobalExclusion(blockingBookings, slot as Slot);
    return NextResponse.json({ available });

  } catch (err) {
    console.error('Availability check error:', err);
    return NextResponse.json({ available: false, error: 'Server error' }, { status: 500 });
  }
}
