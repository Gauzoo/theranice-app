import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { userName, userEmail, userPhone, userActivity } = await request.json();

    if (!userName || !userEmail) {
      return NextResponse.json(
        { error: 'userName et userEmail sont requis' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'Theranice <onboarding@resend.dev>',
      to: ['gauthier.guerin@gmail.com'], // Email de l'admin
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
                <p style="margin: 5px 0;"><strong>Nom :</strong> ${userName}</p>
                <p style="margin: 5px 0;"><strong>Email :</strong> ${userEmail}</p>
                <p style="margin: 5px 0;"><strong>Téléphone :</strong> ${userPhone || 'Non renseigné'}</p>
                <p style="margin: 5px 0;"><strong>Activité :</strong> ${userActivity || 'Non renseignée'}</p>
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
