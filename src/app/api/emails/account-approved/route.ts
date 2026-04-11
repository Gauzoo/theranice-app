import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EMAIL_FROM } from '@/lib/constants';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const schema = z.object({
  userEmail: z.string().email().max(320),
  userName: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }
    const { userEmail, userName } = result.data;
    const safeUserName = escapeHtml(userName);

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [userEmail],
      subject: '✅ Votre compte Theranice a été validé !',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #ffffff;
                padding: 30px;
                border: 1px solid #e0e0e0;
                border-top: none;
                border-radius: 0 0 10px 10px;
              }
              .success-box {
                background: #d1fae5;
                padding: 20px;
                border-left: 4px solid #10b981;
                margin: 20px 0;
                text-align: center;
              }
              .button {
                display: inline-block;
                background: #D4A373;
                color: white;
                padding: 15px 40px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
                font-weight: bold;
                font-size: 16px;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">✅ Compte validé !</h1>
            </div>
            <div class="content">
              <p>Bonjour ${safeUserName},</p>
              
              <div class="success-box">
                <p style="margin: 0; font-size: 16px;">Votre compte Theranice a été approuvé.</p>
              </div>

              <p>Vous pouvez dès maintenant réserver vos créneaux pour vos séances de thérapie.</p>

              <p><strong>Nos salles disponibles :</strong></p>
              <ul>
                <li>Athéna – 30€ le matin / 40€ l'après-midi / 65€ la journée</li>
                <li>Gaïa – 30€ le matin / 40€ l'après-midi / 65€ la journée</li>
                <li>Grande salle – 70€ la demi-journée / 130€ la journée</li>
              </ul>

              <p><strong>Créneaux horaires :</strong></p>
              <ul>
                <li>Matin : 7h30 – 13h</li>
                <li>Après-midi : 13h30 – 20h30</li>
                <li>Journée complète : 7h30 – 20h30</li>
              </ul>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reservation" class="button">
                  Réserver maintenant
                </a>
              </div>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Nous sommes ravis de vous accueillir chez Theranice. N'hésitez pas à nous contacter si vous avez des questions.
              </p>
            </div>
            <div class="footer">
              <p>Theranice - Espace de thérapie</p>
              <p>Nice, France</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in /api/emails/account-approved:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
