import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { generateInvoicePDF } from '@/lib/invoice';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { email, nom, prenom, date, slot, room, price, bookingId } = await request.json();

    // Récupérer l'adresse du client depuis le profil
    const { data: booking } = await supabase
      .from('bookings')
      .select('user_id')
      .eq('id', bookingId)
      .single();

    let clientAdresse = '';
    if (booking?.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('adresse')
        .eq('id', booking.user_id)
        .single();
      clientAdresse = profile?.adresse || '';
    }

    // 1. Générer le numéro de facture séquentiel F-ANNÉE-XXX
    const year = new Date().getFullYear();
    const prefix = `F-${year}-`;

    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `${prefix}%`)
      .order('invoice_number', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastInvoice?.invoice_number) {
      const lastNumStr = lastInvoice.invoice_number.replace(prefix, '');
      const lastNum = parseInt(lastNumStr, 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    const invoiceNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    // 2. Générer le PDF
    const pdfBuffer = generateInvoicePDF({
      invoiceNumber,
      nom,
      prenom,
      clientAdresse,
      dateEmission: today,
      datePrestation: date,
      datePaiement: today,
      room,
      slot,
      amountHT: parseFloat(price),
    });

    // 3. Insérer la facture en base
    const { error: insertError } = await supabase
      .from('invoices')
      .insert({
        booking_id: bookingId,
        user_id: booking?.user_id || null,
        invoice_number: invoiceNumber,
        amount_ht: parseFloat(price),
        amount_ttc: parseFloat(price),
        date_emission: today,
        date_prestation: date,
        date_paiement: today,
        room,
        slot,
        nom,
        prenom,
      });

    if (insertError) {
      console.error('Invoice insert error:', insertError);
      // On continue quand même l'envoi de l'email
    }

    // 4. Formatage des labels pour l'email
    const roomLabels: Record<string, string> = {
      room1: 'Salon Athéna',
      room2: 'Salle Gaïa',
      large: 'Grande salle',
    };
    const roomLabel = roomLabels[room] || room;

    const bookingDate = new Date(date + 'T00:00:00');
    const formattedDate = bookingDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // 5. Envoyer l'email avec le PDF en pièce jointe
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Theranice <onboarding@resend.dev>',
      to: [email],
      subject: `Votre facture ${invoiceNumber} – THÉRANICE`,
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ],
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.7; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #D4A373 0%, #c39363 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">THÉRANICE</h1>
              <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Votre facture</p>
            </div>
            
            <!-- Content -->
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none;">
              
              <p>Madame, Monsieur,</p>
              
              <p>Nous vous prions de bien vouloir trouver ci-joint la facture n° <strong>${invoiceNumber}</strong> relative à la mise à disposition temporaire d'espace professionnel intervenue le <strong>${formattedDate}</strong>.</p>
              
              <div style="background: #FEFAE0; border-left: 4px solid #D4A373; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #666; font-weight: 600;">Facture n°</td>
                    <td style="padding: 6px 0; color: #333;">${invoiceNumber}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e5e5e5;">
                    <td style="padding: 6px 0; color: #666; font-weight: 600;">Salle</td>
                    <td style="padding: 6px 0; color: #333;">${roomLabel}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e5e5e5;">
                    <td style="padding: 6px 0; color: #666; font-weight: 600;">Montant TTC</td>
                    <td style="padding: 6px 0; color: #333; font-weight: 600;">${price} €</td>
                  </tr>
                </table>
              </div>
              
              <p>Nous vous confirmons que le règlement a été enregistré par <strong>carte bancaire</strong>.</p>
              
              <p>Cette facture demeure également accessible depuis votre espace personnel.</p>
              
              <p style="font-size: 13px; color: #666; margin-top: 20px;">
                Dans le cadre de notre engagement solidaire, 1 € sera reversé à la Ligue contre le Cancer au titre de cette réservation.
              </p>
              
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;">
              
              <p style="font-size: 13px; color: #666;">
                Nous vous remercions de la confiance accordée à THÉRANICE et restons à votre disposition pour toute information complémentaire.
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
      `,
    });

    if (emailError) {
      console.error('Invoice email error:', emailError);
      return NextResponse.json({ error: 'Erreur envoi facture' }, { status: 500 });
    }

    return NextResponse.json({ success: true, invoiceNumber, data: emailData });
  } catch (err) {
    console.error('Send invoice error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
