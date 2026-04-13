import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EMAIL_FROM, CONTACT_EMAIL } from '@/lib/constants';
import { isInternalApiRequest } from '@/lib/internalApiAuth';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const schema = z.object({
  userEmail: z.string().email().max(320),
  userName: z.string().min(1).max(200),
  rejectionNotes: z.string().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    if (!isInternalApiRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }
    const { userEmail, userName, rejectionNotes } = result.data;
    const safeUserName = escapeHtml(userName);
    const safeRejectionNotes = escapeHtml(rejectionNotes);
    const rejectionNotesHtml = safeRejectionNotes.replace(/\n/g, '<br />');

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [userEmail],
      subject: 'Votre demande de compte Theranice',
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
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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
              .warning-box {
                background: #fee2e2;
                padding: 20px;
                border-left: 4px solid #ef4444;
                margin: 20px 0;
              }
              .notes-box {
                background: #f3f4f6;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                font-style: italic;
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
              <h1 style="margin: 0;">Votre demande de compte</h1>
            </div>
            <div class="content">
              <p>Bonjour ${safeUserName},</p>
              
              <div class="warning-box">
                <p style="margin: 0; font-size: 16px;">Nous avons examiné votre demande de compte et ne pouvons malheureusement pas l'approuver dans son état actuel.</p>
              </div>

              <p><strong>Raison du refus :</strong></p>
              <div class="notes-box">
                <p style="margin: 0;">${rejectionNotesHtml}</p>
              </div>

              <p>Nous vous invitons à :</p>
              <ul>
                <li>Vérifier que vos documents sont lisibles et à jour</li>
                <li>Vous assurer que tous les champs requis sont correctement remplis</li>
                <li>Soumettre à nouveau votre demande après correction</li>
              </ul>

              <p>Si vous avez des questions ou besoin d'assistance, n'hésitez pas à nous contacter directement :</p>
              <p style="margin-left: 20px;">
                📧 Email : <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
              </p>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/profil" class="button">
                  Mettre à jour mon profil
                </a>
              </div>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Nous restons à votre disposition pour toute question.
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
    console.error('Error in /api/emails/account-rejected:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
