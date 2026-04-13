import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  SLOT_LABELS,
  ROOM_LABELS,
  EMAIL_FROM,
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

    const { email, nom, prenom, date, slot, room } = result.data;
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
    const roomLabel = ROOM_LABELS[room as keyof typeof ROOM_LABELS] || room;

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [email],
      subject: '🔴 Annulation de votre réservation - Theranice',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #ffffff;
                padding: 30px;
                border: 1px solid #e5e5e5;
              }
              .info-box {
                background: #fee2e2;
                border-left: 4px solid #dc2626;
                padding: 20px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #fecaca;
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .label {
                font-weight: 600;
                color: #666;
              }
              .value {
                color: #333;
                font-weight: 500;
              }
              .footer {
                text-align: center;
                color: #999;
                font-size: 12px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e5e5;
              }
              .button {
                display: inline-block;
                background: #D4A373;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Réservation annulée</h1>
            </div>
            
            <div class="content">
              <p>Bonjour ${safePrenom} ${safeNom},</p>
              
              <p>Votre réservation a bien été annulée comme demandé.</p>
              
              <div class="info-box">
                <div class="info-row">
                  <span class="label">📅 Date : </span>
                  <span class="value">${formattedDate}</span>
                </div>
                <div class="info-row">
                  <span class="label">🕐 Créneau : </span>
                  <span class="value">${slotLabel}</span>
                </div>
                <div class="info-row">
                  <span class="label">🏠 Salle : </span>
                  <span class="value">${roomLabel}</span>
                </div>
              </div>
              
              <p>Nous espérons vous revoir bientôt chez <strong>Theranice</strong>.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/reservation" class="button">
                  Faire une nouvelle réservation
                </a>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
              
              <p style="font-size: 14px; color: #666;">
                <strong>📍 Adresse :</strong> [Votre adresse à Nice]<br>
                <strong>📞 Contact :</strong> [Votre numéro de téléphone]<br>
                <strong>✉️ Email :</strong> contact@theranice.fr
              </p>
            </div>
            
            <div class="footer">
              <p>Cet email a été envoyé par Theranice</p>
              <p>© ${new Date().getFullYear()} Theranice - Tous droits réservés</p>
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
