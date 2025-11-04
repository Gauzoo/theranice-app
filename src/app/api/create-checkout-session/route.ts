import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    // Vérifie que la clé API Stripe est configurée
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('STRIPE_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { userId, date, slot, room, price, email, nom, prenom } = await request.json();

    // Labels pour l'affichage
    const slotLabels: Record<string, string> = {
      morning: 'Matin (8h-12h)',
      afternoon: 'Après-midi (13h-17h)',
      fullday: 'Journée complète (8h-17h)'
    };
    const slotLabel = slotLabels[slot] || slot;
    const roomLabels: Record<string, string> = {
      room1: 'Salle 1 (35m²)',
      room2: 'Salle 2 (35m²)',
      large: 'Grande salle (70m²)'
    };
    const roomLabel = roomLabels[room] || room;

    // Formatage de la date
    const bookingDate = new Date(date + 'T00:00:00');
    const formattedDate = bookingDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Crée une session de checkout Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Réservation ${roomLabel}`,
              description: `${formattedDate} - ${slotLabel}`,
            },
            unit_amount: Math.round(price * 100), // Stripe attend le montant en centimes
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
        date,
        slot,
        room,
        price: price.toString(),
        nom,
        prenom,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return NextResponse.json({ error: 'Erreur lors de la création de la session de paiement' }, { status: 500 });
  }
}
