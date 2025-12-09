import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Désactive le body parser de Next.js pour Stripe webhooks
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Stripe keys not configured');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('No stripe-signature header');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Traite l'événement de paiement réussi
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Récupère les métadonnées de la réservation
      const { userId, dates: datesJson, date: singleDate, slot, room, price, nom, prenom } = session.metadata || {};

      let dates: string[] = [];
      if (datesJson) {
        try {
          dates = JSON.parse(datesJson);
        } catch (e) {
          console.error('Error parsing dates JSON:', e);
          dates = [];
        }
      } else if (singleDate) {
        dates = [singleDate];
      }

      if (!userId || dates.length === 0 || !slot || !room || !price) {
        console.error('Missing metadata in session:', session.id);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // VÉRIFICATION CRITIQUE : vérifie la disponibilité côté serveur
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const unitPrice = parseFloat(price) / dates.length;
      const results = [];

      for (const date of dates) {
        // Vérifie les réservations existantes pour cette date
        const { data: existingBookings, error: checkError } = await supabase
          .from('bookings')
          .select('slot, room')
          .eq('date', date)
          .eq('status', 'confirmed');

        if (checkError) {
          console.error(`Error checking availability for ${date}:`, checkError);
          results.push({ date, status: 'error', error: 'Check failed' });
          continue;
        }

        // Vérifie la disponibilité selon la logique métier
        let isAvailable = true;

        if (slot === 'fullday') {
          if (room === 'large') {
            isAvailable = existingBookings.length === 0;
          } else {
            const roomBooked = existingBookings.some(b => b.room === room);
            const largeBooked = existingBookings.some(b => b.room === 'large');
            isAvailable = !roomBooked && !largeBooked;
          }
        } else {
          // Matin ou après-midi
          const fulldayBooked = existingBookings.some(b => b.slot === 'fullday' && b.room === room);
          const largeFulldayBooked = existingBookings.some(b => b.slot === 'fullday' && b.room === 'large');
          
          if (fulldayBooked || largeFulldayBooked) {
            isAvailable = false;
          } else {
            const bookingsForSlot = existingBookings.filter(b => b.slot === slot);
            if (room === 'large') {
              isAvailable = bookingsForSlot.length === 0;
            } else {
              const roomBooked = bookingsForSlot.some(b => b.room === room);
              const largeBooked = bookingsForSlot.some(b => b.room === 'large');
              isAvailable = !roomBooked && !largeBooked;
            }
          }
        }

        if (!isAvailable) {
          console.error('Slot no longer available:', { date, slot, room, session: session.id });
          results.push({ date, status: 'unavailable' });
          continue;
        }
        
        // Crée la réservation dans Supabase avec service_role (bypass RLS)
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            user_id: userId,
            date,
            slot,
            room,
            price: unitPrice,
            status: 'confirmed',
            payment_intent_id: session.payment_intent as string,
          })
          .select()
          .single();

        if (bookingError) {
          console.error(`Error creating booking for ${date}:`, bookingError);
          results.push({ date, status: 'error', error: 'Database error' });
          continue;
        }

        results.push({ date, status: 'success', id: bookingData.id });

        // Envoie l'email de confirmation (un par date pour l'instant)
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: session.customer_email,
              nom,
              prenom,
              date,
              slot,
              room,
              price: unitPrice,
              bookingId: bookingData.id,
            }),
          });
        } catch (emailError) {
          console.error(`Error sending confirmation email for ${date}:`, emailError);
        }
      }

      // Si au moins une réservation a échoué, on loggue un warning
      const failures = results.filter(r => r.status !== 'success');
      if (failures.length > 0) {
        console.warn('Some bookings failed:', failures);
        return NextResponse.json({ 
          received: true, 
          warning: 'Some bookings failed',
          results 
        });
      }

      return NextResponse.json({ received: true, results });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
