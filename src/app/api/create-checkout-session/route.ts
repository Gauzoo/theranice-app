import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

type Slot = 'morning' | 'afternoon' | 'fullday';
type Room = 'room1' | 'room2' | 'large';

interface CartItem {
  date: string;
  slot: Slot;
  room: Room;
}

interface CheckoutPayload {
  cart: CartItem[];
  email?: string;
  nom?: string;
  prenom?: string;
  userId?: string;
}

const ROOM_PRICES: Record<Room, number> = {
  room1: 35,
  room2: 35,
  large: 70,
};

const FULLDAY_PRICES: Record<Room, number> = {
  room1: 65,
  room2: 65,
  large: 130,
};

const STRIPE_EUR_MINIMUM_CENTS = 50;

function getExpectedPrice(item: CartItem): number {
  return item.slot === 'fullday' ? FULLDAY_PRICES[item.room] : ROOM_PRICES[item.room];
}

function parseAllowedEmails(rawValue?: string): Set<string> {
  if (!rawValue) {
    return new Set();
  }

  return new Set(
    rawValue
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

function getLiveTestAmountCents(rawValue?: string): number {
  const parsed = Number.parseInt(rawValue || '', 10);
  if (Number.isNaN(parsed)) {
    return STRIPE_EUR_MINIMUM_CENTS;
  }

  return Math.max(parsed, STRIPE_EUR_MINIMUM_CENTS);
}

export async function POST(request: NextRequest) {
  try {
    // Vérifie que la clé API Stripe est configurée
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('STRIPE_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { cart, email, nom, prenom, userId } = await request.json() as CheckoutPayload;

    // Validation du panier
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: 'Le panier est vide' }, { status: 400 });
    }

    // 1. Vérification de la disponibilité pour tous les items du panier
    for (const item of cart) {
      const { date, slot, room } = item;
      
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('slot, room')
        .eq('date', date)
        .eq('status', 'confirmed');

      if (existingBookings) {
        let isAvailable = true;
        const bookings = existingBookings as any[];

        if (slot === 'fullday') {
          if (room === 'large') {
            isAvailable = bookings.length === 0;
          } else {
            const roomBooked = bookings.some(b => b.room === room);
            const largeBooked = bookings.some(b => b.room === 'large');
            isAvailable = !roomBooked && !largeBooked;
          }
        } else {
          // Matin ou après-midi
          const fulldayBooked = bookings.some(b => b.slot === 'fullday' && b.room === room);
          const largeFulldayBooked = bookings.some(b => b.slot === 'fullday' && b.room === 'large');
          
          if (fulldayBooked || largeFulldayBooked) {
            isAvailable = false;
          } else {
            const bookingsForSlot = bookings.filter(b => b.slot === slot);
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
          return NextResponse.json({ 
            error: `Le créneau ${slot} du ${date} pour la salle ${room} n'est plus disponible.` 
          }, { status: 409 });
        }
      }
    }

    // Vérification que les créneaux n'ont pas déjà commencé (sécurité côté serveur)
    const SLOT_START_HOURS: Record<string, number> = { morning: 8, afternoon: 13, fullday: 8 };
    const now = new Date();
    const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const todayStr = `${parisTime.getFullYear()}-${String(parisTime.getMonth() + 1).padStart(2, '0')}-${String(parisTime.getDate()).padStart(2, '0')}`;
    const currentHour = parisTime.getHours();

    for (const item of cart) {
      if (item.date === todayStr && currentHour >= (SLOT_START_HOURS[item.slot] ?? 0)) {
        const slotName = item.slot === 'morning' ? 'Matin (8h-12h)' 
          : item.slot === 'afternoon' ? 'Après-midi (13h-17h)' 
          : 'Journée complète (8h-17h)';
        return NextResponse.json({ 
          error: `Le créneau "${slotName}" du ${item.date} a déjà commencé et ne peut plus être réservé.` 
        }, { status: 400 });
      }
    }

    // Préparation des paramètres
    const slotLabels: Record<string, string> = {
      morning: 'Matin (8h-12h)',
      afternoon: 'Après-midi (13h-17h)',
      fullday: 'Journée complète (8h-17h)'
    };
    
    const roomLabels: Record<string, string> = {
      room1: 'Athéna',
      room2: 'Gaïa',
      large: 'Grande salle'
    };

    // Construction de la description du panier pour Stripe
    // Comme on a potentiellement beaucoup d'items, on fait un résumé
    const itemCount = cart.length;
    let description = `${itemCount} créneau${itemCount > 1 ? 'x' : ''} de réservation`;
    if (itemCount <= 3) {
      description = cart.map((item: any) => 
        `${item.date} (${slotLabels[item.slot]})`
      ).join(', ');
    }


    // Calcul du prix total et validation côté serveur
    const cartWithSecurePrices = cart.map((item) => ({
      item,
      expectedPrice: getExpectedPrice(item),
    }));

    if (cartWithSecurePrices.some(({ expectedPrice }) => !expectedPrice || expectedPrice <= 0)) {
      return NextResponse.json({ error: 'Panier invalide' }, { status: 400 });
    }

    const totalPrice = cartWithSecurePrices.reduce((sum, entry) => sum + entry.expectedPrice, 0);

    const normalizedEmail = email?.trim().toLowerCase();
    const liveTestEnabled = process.env.STRIPE_LIVE_TEST_ENABLED === 'true';
    const allowedLiveTestEmails = parseAllowedEmails(process.env.STRIPE_LIVE_TEST_EMAILS);
    const isLiveTestBooking =
      liveTestEnabled
      && !!normalizedEmail
      && allowedLiveTestEmails.has(normalizedEmail);

    if (isLiveTestBooking && cart.length > 1) {
      return NextResponse.json(
        { error: 'Le mode live test est limite a un seul creneau par paiement.' },
        { status: 400 }
      );
    }

    const liveTestAmountCents = getLiveTestAmountCents(process.env.STRIPE_LIVE_TEST_AMOUNT_CENTS);
    const stripeAmountCents = isLiveTestBooking
      ? liveTestAmountCents
      : Math.round(totalPrice * 100);

    const metadata: Record<string, string> = {
      userId: userId || '',
      type: 'cart_checkout',
      nom: nom || '',
      prenom: prenom || '',
    };

    if (isLiveTestBooking) {
      metadata.live_test = 'true';
      metadata.live_test_amount_cents = String(liveTestAmountCents);
    }

    // Crée une session de checkout Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Réservation Theranice',
              description: description,
            },
            unit_amount: stripeAmountCents, // Stripe attend le montant en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/reservation/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/reservation/cancel`,
      customer_email: email,
      metadata,
    });

    // 2. Insérer les réservations en statut 'pending_payment'
    const bookingsToInsert = cartWithSecurePrices.map(({ item, expectedPrice }) => {
      const securePrice = isLiveTestBooking ? liveTestAmountCents / 100 : expectedPrice;

      return {
        user_id: userId,
        date: item.date,
        slot: item.slot,
        room: item.room,
        price: securePrice,
        status: 'pending_payment',
        stripe_session_id: session.id,
      };
    });

    const { error: insertError } = await supabase
      .from('bookings')
      .insert(bookingsToInsert);

    if (insertError) {
      console.error('Error creating pending bookings:', insertError);
      // On pourrait annuler la session Stripe ici, mais c'est complexe
      return NextResponse.json({ error: 'Erreur lors de la création des réservations' }, { status: 500 });
    }

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return NextResponse.json({ error: 'Erreur lors de la création de la session de paiement' }, { status: 500 });
  }
}
