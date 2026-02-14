import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { generateUniquePinCode, createNukiKeypadCode, formatPinCode } from '@/lib/nuki';

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
      const { type } = session.metadata || {};

      // VÉRIFICATION CRITIQUE : vérifie la disponibilité côté serveur
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // --- NOUVELLE LOGIQUE PANIER ---
      if (type === 'cart_checkout') {
        // 1. Récupérer les réservations en attente
        const { data: pendingBookings, error: fetchError } = await supabase
          .from('bookings')
          .select('*')
          .eq('stripe_session_id', session.id)
          .eq('status', 'pending_payment');

        if (fetchError || !pendingBookings || pendingBookings.length === 0) {
          console.error('No pending bookings found for checkout session:', session.id);
          return NextResponse.json({ error: 'Bookings not found' }, { status: 404 });
        }

        const results = [];

        // 2. Pour chaque réservation, vérifier qu'elle est toujours libre (Race condition check)
        for (const booking of pendingBookings) {
          const { date, slot, room } = booking;

          // Récupère les réservations CONFIRMÉES pour ce jour
          const { data: confirmedBookings } = await supabase
            .from('bookings')
            .select('slot, room')
            .eq('date', date)
            .eq('status', 'confirmed');

          let isAvailable = true;
          const bookings = confirmedBookings || [];

          // Logique de vérification stricte
          if (slot === 'fullday') {
            if (room === 'large') {
              isAvailable = bookings.length === 0;
            } else {
              isAvailable = !bookings.some(b => b.room === room || b.room === 'large');
            }
          } else {
            const fulldayBooked = bookings.some(b => b.slot === 'fullday' && (b.room === room || b.room === 'large'));
            if (fulldayBooked) isAvailable = false;
            else {
               const slotBookings = bookings.filter(b => b.slot === slot);
               if (room === 'large') {
                 isAvailable = slotBookings.length === 0;
               } else {
                 isAvailable = !slotBookings.some(b => b.room === room || b.room === 'large');
               }
            }
          }

          if (isAvailable) {
            // Générer le code PIN Nuki AVANT de confirmer
            let accessCode: string | null = null;
            let nukiAuthId: string | null = null;
            let nukiCodeStatus = 'none';

            try {
              const pinCode = await generateUniquePinCode(supabase);
              const authName = `Resa ${booking.id.substring(0, 8)} ${session.metadata?.prenom || ''}`.trim();
              
              const nukiResult = await createNukiKeypadCode(
                authName,
                pinCode,
                date,
                slot
              );

              if (nukiResult.success) {
                accessCode = String(pinCode);
                nukiAuthId = nukiResult.authId || null;
                nukiCodeStatus = 'active';
                console.log(`[Nuki] Code ${formatPinCode(pinCode)} created for booking ${booking.id}`);
              } else {
                console.error(`[Nuki] Failed to create code for booking ${booking.id}:`, nukiResult.error);
                // On sauvegarde quand même le code pour référence, statut = error
                accessCode = String(pinCode);
                nukiCodeStatus = 'error';
              }
            } catch (nukiError) {
              console.error('[Nuki] Unexpected error:', nukiError);
              nukiCodeStatus = 'error';
            }

            // Confirmer la réservation avec le code d'accès
            const { error: updateError } = await supabase
              .from('bookings')
              .update({ 
                status: 'confirmed', 
                payment_intent_id: session.payment_intent as string,
                access_code: accessCode,
                nuki_auth_id: nukiAuthId,
                nuki_code_status: nukiCodeStatus,
              })
              .eq('id', booking.id);

            if (!updateError) {
              results.push({ id: booking.id, status: 'confirmed', accessCode });
              
              // Envoi email confirmation avec le vrai code
              try {
                await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-confirmation`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: session.customer_email,
                    nom: session.metadata?.nom,
                    prenom: session.metadata?.prenom,
                    date,
                    slot,
                    room,
                    price: booking.price,
                    bookingId: booking.id,
                    accessCode: accessCode,
                  }),
                });
              } catch (e) { console.error('Email error', e); }

            } else {
              results.push({ id: booking.id, status: 'error', error: updateError });
            }
          } else {
            // Conflit détecté
            console.error('CONFLIT: Réservation payée mais créneau plus disponible', booking);
            const { error: failError } = await supabase
              .from('bookings')
              .update({ status: 'conflict_paid' }) // Statut spécial pour gestion manuelle/remboursement
              .eq('id', booking.id);
            
            results.push({ id: booking.id, status: 'conflict' });
          }
        }

        return NextResponse.json({ received: true, results });
      }

      // --- ANCIENNE LOGIQUE (Fallback) ---
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
      // (Supabase client déjà initialisé plus haut)

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
        // Générer le code PIN Nuki
        let accessCode: string | null = null;
        let nukiAuthId: string | null = null;
        let nukiCodeStatus = 'none';

        try {
          const pinCode = await generateUniquePinCode(supabase);
          const authName = `Resa ${nom || ''} ${prenom || ''}`.trim().substring(0, 32);
          
          const nukiResult = await createNukiKeypadCode(authName, pinCode, date, slot);

          if (nukiResult.success) {
            accessCode = String(pinCode);
            nukiAuthId = nukiResult.authId || null;
            nukiCodeStatus = 'active';
          } else {
            accessCode = String(pinCode);
            nukiCodeStatus = 'error';
          }
        } catch (nukiError) {
          console.error('[Nuki] Error in legacy flow:', nukiError);
          nukiCodeStatus = 'error';
        }

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
            access_code: accessCode,
            nuki_auth_id: nukiAuthId,
            nuki_code_status: nukiCodeStatus,
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
              accessCode: accessCode,
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
