import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { formatPinCode } from '@/lib/nuki';
import {
  SLOT_LABELS,
  ROOM_LABELS_FORMAL,
  SLOT_ACCESS_TIMES,
  CONTACT_EMAIL,
  EMAIL_FROM,
  BUSINESS_LEGAL_NAME,
  BUSINESS_ADDRESS,
  BUSINESS_POSTAL_CODE,
  BUSINESS_CITY,
} from '@/lib/constants';
import { isInternalApiRequest } from '@/lib/internalApiAuth';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const schema = z.object({
  email: z.string().email().max(320),
  nom: z.string().max(200).optional(),
  prenom: z.string().max(200).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.enum(['morning', 'afternoon', 'fullday']),
  room: z.enum(['room1', 'room2', 'large']),
  price: z.coerce.number().finite().nonnegative(),
  accessCode: z.union([z.string(), z.number()]).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    if (!isInternalApiRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérifie que la clé API est configurée
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { email, nom, prenom, date, slot, room, price, accessCode } = result.data;
    const safeNom = escapeHtml(nom || '');
    const safePrenom = escapeHtml(prenom || '');

    // Formatage de la date
    const bookingDate = new Date(date + 'T00:00:00');
    const formattedDate = bookingDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Labels des créneaux et salles
    const slotLabel = SLOT_LABELS[slot as keyof typeof SLOT_LABELS] || slot;
    const roomLabel = ROOM_LABELS_FORMAL[room as keyof typeof ROOM_LABELS_FORMAL] || room;

    // Horaires d'accès par créneau (avec 30 min de marge)
    const accessTimeLabel = SLOT_ACCESS_TIMES[slot as keyof typeof SLOT_ACCESS_TIMES] || '';

    // Utilise le code réel Nuki passé par le webhook, ou fallback
    const normalizedAccessCode = accessCode == null
      ? null
      : String(accessCode).replace(/\D/g, '');
    const displayCode = normalizedAccessCode ? formatPinCode(normalizedAccessCode) : null;
    const codeAvailable = !!normalizedAccessCode;

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
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
                    <td style="padding: 8px 0; color: #333;">${safePrenom} ${safeNom}</td>
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
              <p>La facture correspondante vous sera transmise en pièce jointe d'un email séparé après votre créneau.</p>
              
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
                Dans le cadre de l'engagement solidaire de THÉRANICE, 1 € sera reversé par la ${BUSINESS_LEGAL_NAME} à la Ligue contre le Cancer au titre de cette réservation.
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
                📍 ${BUSINESS_ADDRESS}, ${BUSINESS_POSTAL_CODE} ${BUSINESS_CITY}<br>
                ✉️ ${CONTACT_EMAIL}
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
