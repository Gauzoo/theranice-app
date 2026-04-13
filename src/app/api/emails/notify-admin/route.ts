import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EMAIL_FROM } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const schema = z.object({
  userName: z.string().min(1).max(200),
  userEmail: z.string().email().max(320).optional(),
  userPhone: z.string().max(30).optional(),
  userActivity: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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
    const { userName, userPhone, userActivity } = result.data;
    const verifiedEmail = user.email || result.data.userEmail;
    if (!verifiedEmail) {
      return NextResponse.json({ error: 'Email utilisateur introuvable' }, { status: 400 });
    }

    const safeUserName = escapeHtml(userName);
    const safeUserEmail = escapeHtml(verifiedEmail);
    const safeUserPhone = escapeHtml(userPhone || 'Non renseigné');
    const safeUserActivity = escapeHtml(userActivity || 'Non renseignée');

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean),
      subject: '🔔 Nouveau compte à valider - Theranice',
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
                background: linear-gradient(135deg, #D4A373 0%, #c49363 100%);
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
              .info-box {
                background: #FAEDCD;
                padding: 15px;
                border-left: 4px solid #D4A373;
                margin: 20px 0;
              }
              .button {
                display: inline-block;
                background: #D4A373;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
                font-weight: bold;
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
              <h1 style="margin: 0;">🔔 Nouveau compte à valider</h1>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Un nouveau membre a soumis ses documents et souhaite rejoindre Theranice.</p>
              
              <div class="info-box">
                <p style="margin: 5px 0;"><strong>Nom :</strong> ${safeUserName}</p>
                <p style="margin: 5px 0;"><strong>Email :</strong> ${safeUserEmail}</p>
                <p style="margin: 5px 0;"><strong>Téléphone :</strong> ${safeUserPhone}</p>
                <p style="margin: 5px 0;"><strong>Activité :</strong> ${safeUserActivity}</p>
              </div>

              <p>Les documents (carte d'identité et KBIS) sont disponibles dans votre dashboard admin.</p>

              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin" class="button">
                Voir le dashboard admin
              </a>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Connectez-vous pour consulter les documents et approuver ou rejeter ce compte.
              </p>
            </div>
            <div class="footer">
              <p>Theranice - Espace de thérapie</p>
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
    console.error('Error in /api/emails/notify-admin:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
