import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { userEmail, userName } = await request.json();

    if (!userEmail || !userName) {
      return NextResponse.json(
        { error: 'userEmail et userName sont requis' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'Theranice <onboarding@resend.dev>',
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
              <p>Bonjour ${userName},</p>
              
              <div class="success-box">
                <h2 style="margin: 0 0 10px 0; color: #10b981;">🎉 Félicitations !</h2>
                <p style="margin: 0; font-size: 16px;">Votre compte Theranice a été approuvé.</p>
              </div>

              <p>Vous pouvez dès maintenant réserver vos créneaux pour vos séances de thérapie.</p>

              <p><strong>Nos salles disponibles :</strong></p>
              <ul>
                <li>Salle 1 (35m²) - 50€/créneau</li>
                <li>Salle 2 (35m²) - 50€/créneau</li>
                <li>Grande salle (70m²) - 80€/créneau</li>
              </ul>

              <p><strong>Créneaux horaires :</strong></p>
              <ul>
                <li>Matin : 8h-12h</li>
                <li>Après-midi : 13h-17h</li>
                <li>Journée complète : 8h-17h (tarif réduit)</li>
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
