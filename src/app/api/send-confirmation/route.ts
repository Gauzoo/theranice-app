import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { formatPinCode } from '@/lib/nuki';

export async function POST(request: NextRequest) {
  try {
    // Vérifie que la clé API est configurée
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { email, nom, prenom, date, slot, room, price, accessCode } = await request.json();

    // Formatage de la date
    const bookingDate = new Date(date + 'T00:00:00');
    const formattedDate = bookingDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Labels des créneaux et salles
    const slotLabels: Record<string, string> = {
      morning: 'Matin (7h30 – 13h)',
      afternoon: 'Après-midi (13h30 – 20h30)',
      fullday: 'Journée complète (7h30 – 20h30)'
    };
    const slotLabel = slotLabels[slot] || slot;
    const roomLabels: Record<string, string> = {
      room1: 'Salon Athéna',
      room2: 'Salle Gaïa',
      large: 'Grande salle'
    };
    const roomLabel = roomLabels[room] || room;

    // Horaires d'accès par créneau (avec 30 min de marge)
    const slotAccessTimes: Record<string, string> = {
      morning: '7h – 13h30',
      afternoon: '13h – 21h',
      fullday: '7h – 21h',
    };
    const accessTimeLabel = slotAccessTimes[slot] || '';

    // Utilise le code réel Nuki passé par le webhook, ou fallback
    const displayCode = accessCode ? formatPinCode(accessCode) : null;
    const codeAvailable = !!accessCode;

    const { data, error } = await resend.emails.send({
      from: 'Theranice <onboarding@resend.dev>',
      to: [email],
      subject: 'Confirmation de votre réservation – THÉRANICE',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.7; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #D4A373 0%, #c39363 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">THÉRANICE</h1>
              <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Confirmation de réservation</p>
            </div>
            
            <!-- Content -->
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none;">
              
              <p>Madame, Monsieur,</p>
              
              <p>Nous accusons réception de votre réservation effectuée sur la plateforme THÉRANICE.<br>
              Votre créneau est confirmé selon les modalités suivantes :</p>
              
              <!-- Détail réservation -->
              <div style="background: #FEFAE0; border-left: 4px solid #D4A373; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 4px; font-weight: 700; font-size: 15px; color: #D4A373; text-transform: uppercase; letter-spacing: 1px;">Détail de la réservation</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: 600; width: 140px;">Nom</td>
                    <td style="padding: 8px 0; color: #333;">${prenom} ${nom}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e5e5e5;">
                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Salle réservée</td>
                    <td style="padding: 8px 0; color: #333;">${roomLabel}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e5e5e5;">
                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Date</td>
                    <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e5e5e5;">
                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Créneau</td>
                    <td style="padding: 8px 0; color: #333;">${slotLabel}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e5e5e5;">
                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Montant réglé</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 600;">${price} €</td>
                  </tr>
                </table>
              </div>
              
              <p>Le règlement a bien été enregistré.</p>
              <p>La facture correspondante vous est transmise en pièce jointe d'un email séparé.</p>
              
              <!-- Code d'accès -->
              <h3 style="color: #D4A373; margin-top: 30px; font-size: 16px;">🔐 Votre code d'accès</h3>
              ${codeAvailable ? `
              <p>Utilisez ce code sur le clavier à l'entrée pour accéder à la salle le jour de votre réservation :</p>
              
              <div style="background: #D4A373; color: white; font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 20px; margin: 20px 0; border-radius: 8px;">
                ${displayCode}
              </div>
              
              <p style="color: #666; font-size: 14px; text-align: center;">
                ⏰ <strong>Code valide le ${formattedDate} de ${accessTimeLabel}</strong><br><br>
                Tapez ce code à 6 chiffres sur le clavier Nuki à l'entrée du local.<br>
                Le code sera automatiquement désactivé après votre créneau.
              </p>
              ` : `
              <p style="color: #B12F2E; text-align: center;">
                ⚠️ Le code d'accès n'a pas pu être généré automatiquement.<br>
                Nous vous contacterons pour vous le communiquer.
              </p>
              `}
              
              <!-- Rappels -->
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
              
              <p style="font-size: 13px; color: #666;">
                Nous vous rappelons que toute dégradation constatée durant la période d'occupation pourra faire l'objet d'une facturation complémentaire conformément aux Conditions de Mise à Disposition acceptées lors de votre inscription.
              </p>
              
              <p style="font-size: 13px; color: #666;">
                Dans le cadre de l'engagement solidaire de THÉRANICE, 1 € sera reversé par la SCI THERA NICE à la Ligue contre le Cancer au titre de cette réservation.
              </p>
              
              <p style="font-size: 13px; color: #999; margin-top: 20px;">
                💡 <strong>Rappel :</strong> L'annulation est possible jusqu'à 14 jours avant votre créneau.
              </p>
              
              <div style="text-align: center; margin-top: 24px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/mes-reservations" style="display: inline-block; background: #D4A373; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600;">
                  Voir ma réservation
                </a>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
              
              <p style="font-size: 13px; color: #666;">
                Nous restons à votre disposition pour toute question.
              </p>
              <p style="font-size: 13px; color: #666;">
                Cordialement,<br>
                <strong>L'équipe THÉRANICE</strong>
              </p>
              
              <p style="font-size: 12px; color: #999; margin-top: 20px;">
                📍 19 rue Michelet, 06100 Nice<br>
                ✉️ contact@theranice.fr
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; color: #999; font-size: 12px; padding: 20px;">
              <p>© ${new Date().getFullYear()} THÉRANICE – Tous droits réservés</p>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Send email error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
