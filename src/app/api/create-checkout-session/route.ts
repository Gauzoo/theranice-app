import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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

    const { cart, email, nom, prenom, userId } = await request.json();

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

    // Préparation des paramètres
    const slotLabels: Record<string, string> = {
      morning: 'Matin (8h-12h)',
      afternoon: 'Après-midi (13h-17h)',
      fullday: 'Journée complète (8h-17h)'
    };
    
    const roomLabels: Record<string, string> = {
      room1: 'Salle 1 (35m²)',
      room2: 'Salle 2 (35m²)',
      large: 'Grande salle (70m²)'
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


    const ROOM_PRICES: Record<string, number> = {
      room1: 50,
      room2: 50,
      large: 80,
    };
    
    const FULLDAY_PRICES: Record<string, number> = {
      room1: 90,
      room2: 90,
      large: 140,
    };

    // Calcul du prix total et validation côté serveur
    const totalPrice = cart.reduce((sum: number, item: any) => {
      // Recalcule le prix pour chaque item au lieu de faire confiance au client
      const expectedPrice = item.slot === 'fullday' 
        ? FULLDAY_PRICES[item.room] 
        : ROOM_PRICES[item.room];
      return sum + (expectedPrice || 0);
    }, 0);

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
            unit_amount: Math.round(totalPrice * 100), // Stripe attend le montant en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/reservation/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/reservation/cancel`,
      customer_email: email,
      metadata: {
        userId,
        type: 'cart_checkout',
        nom,
        prenom,
        // On ne met pas les détails du panier ici pour éviter de dépasser la limite
        // On se fiera aux réservations en base
      },
    });

    // 2. Insérer les réservations en statut 'pending_payment'
    const bookingsToInsert = cart.map((item: any) => {
      const expectedPrice = item.slot === 'fullday' 
        ? FULLDAY_PRICES[item.room] 
        : ROOM_PRICES[item.room];

      return {
        user_id: userId,
        date: item.date,
        slot: item.slot,
        room: item.room,
        price: expectedPrice, // Utilise le prix sécurisé
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
