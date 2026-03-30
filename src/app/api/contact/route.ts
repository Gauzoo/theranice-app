import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { nom, prenom, sujet, message } = await request.json();

    if (!nom || !prenom || !sujet || !message) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'Theranice <noreply@theranice.fr>',
      to: ['contact@theranice.fr'],
      replyTo: undefined,
      subject: `[Contact] ${sujet}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #D4A373; color: white; padding: 24px 30px; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
              .field { margin-bottom: 16px; }
              .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; font-weight: 600; margin-bottom: 4px; }
              .value { font-size: 15px; color: #333; }
              .message-box { background: #F7F3EE; border-left: 3px solid #D4A373; padding: 16px; margin-top: 8px; white-space: pre-wrap; }
              .footer { text-align: center; margin-top: 20px; color: #aaa; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2 style="margin:0; font-size:20px;">Nouveau message de contact</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Nom</div>
                <div class="value">${nom} ${prenom}</div>
              </div>
              <div class="field">
                <div class="label">Sujet</div>
                <div class="value">${sujet}</div>
              </div>
              <div class="field">
                <div class="label">Message</div>
                <div class="message-box">${message}</div>
              </div>
            </div>
            <div class="footer">
              <p>Theranice — theranice.fr</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Erreur lors de l\'envoi' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in /api/contact:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
