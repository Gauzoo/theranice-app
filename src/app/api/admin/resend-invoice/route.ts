import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { checkAdminPermission } from '@/lib/adminAuth';
import { generateInvoicePDF } from '@/lib/invoice';
import {
  BUSINESS_ADDRESS,
  BUSINESS_CITY,
  BUSINESS_POSTAL_CODE,
  EMAIL_FROM,
  ROOM_LABELS_FORMAL,
} from '@/lib/constants';

type InvoiceRecord = {
  booking_id: string;
  user_id: string;
  invoice_number: string;
  amount_ht: number | string;
  date_emission: string;
  date_prestation: string;
  date_paiement: string;
  room: string;
  slot: string;
  nom: string | null;
  prenom: string | null;
};

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  return normalized || null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    if (!resendApiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY manquante' }, { status: 500 });
    }

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const bookingId = isNonEmptyString(body?.bookingId) ? body.bookingId.trim() : '';
    const invoiceNumber = isNonEmptyString(body?.invoiceNumber) ? body.invoiceNumber.trim() : '';
    const overrideEmail = normalizeEmail(isNonEmptyString(body?.email) ? body.email : null);

    if (!bookingId && !invoiceNumber) {
      return NextResponse.json(
        { error: 'bookingId ou invoiceNumber est requis' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const invoiceQuery = supabase
      .from('invoices')
      .select('booking_id, user_id, invoice_number, amount_ht, date_emission, date_prestation, date_paiement, room, slot, nom, prenom')
      .limit(1);

    const { data: invoice, error: invoiceError } = bookingId
      ? await invoiceQuery.eq('booking_id', bookingId).maybeSingle()
      : await invoiceQuery.eq('invoice_number', invoiceNumber).maybeSingle();

    if (invoiceError) {
      console.error('Error loading invoice for resend:', invoiceError);
      return NextResponse.json({ error: 'Erreur récupération facture' }, { status: 500 });
    }

    const invoiceRecord = invoice as InvoiceRecord | null;
    if (!invoiceRecord) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('adresse, siret')
      .eq('id', invoiceRecord.user_id)
      .maybeSingle();

    if (profileError) {
      console.warn('[resend-invoice] Profile lookup warning:', profileError);
    }

    let recipientEmail = overrideEmail;

    if (!recipientEmail) {
      const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(invoiceRecord.user_id);
      if (authUserError) {
        console.error('[resend-invoice] Auth user lookup failed:', authUserError);
        return NextResponse.json({ error: 'Impossible de récupérer l\'email client' }, { status: 500 });
      }

      recipientEmail = normalizeEmail(authUserData.user?.email);
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Email client introuvable (fournissez email dans la requête)' },
        { status: 400 }
      );
    }

    const amountHT = Number(invoiceRecord.amount_ht);
    if (!Number.isFinite(amountHT) || amountHT <= 0) {
      return NextResponse.json({ error: 'Montant de facture invalide' }, { status: 500 });
    }

    const pdfBuffer = generateInvoicePDF({
      invoiceNumber: invoiceRecord.invoice_number,
      nom: invoiceRecord.nom || '',
      prenom: invoiceRecord.prenom || '',
      clientAdresse: (profile?.adresse as string | null) || '',
      clientSiret: (profile?.siret as string | null) || '',
      dateEmission: invoiceRecord.date_emission,
      datePrestation: invoiceRecord.date_prestation,
      datePaiement: invoiceRecord.date_paiement,
      room: invoiceRecord.room,
      slot: invoiceRecord.slot,
      amountHT,
    });

    const roomLabel = ROOM_LABELS_FORMAL[invoiceRecord.room as keyof typeof ROOM_LABELS_FORMAL] || invoiceRecord.room;
    const prestationDate = new Date(`${invoiceRecord.date_prestation}T00:00:00`);
    const formattedDate = prestationDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const resend = new Resend(resendApiKey);
    const { data: resendData, error: emailError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [recipientEmail],
      subject: 'Votre facture – THÉRANICE',
      attachments: [
        {
          filename: `${invoiceRecord.invoice_number}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ],
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.7; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #D4A373 0%, #c39363 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">THÉRANICE</h1>
              <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Renvoi de votre facture</p>
            </div>

            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none;">
              <p>Madame, Monsieur,</p>
              <p>
                Conformément à votre demande, nous vous renvoyons la facture n°
                <strong>${invoiceRecord.invoice_number}</strong> relative à la mise à disposition
                de <strong>${roomLabel}</strong> le <strong>${formattedDate}</strong>.
              </p>
              <p>Vous la trouverez en pièce jointe à ce message.</p>

              <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;">

              <p style="font-size: 13px; color: #666;">
                Cordialement,<br>
                <strong>L'équipe THÉRANICE</strong>
              </p>

              <p style="font-size: 12px; color: #999; margin-top: 20px;">
                ${BUSINESS_ADDRESS}<br>
                ${BUSINESS_POSTAL_CODE} ${BUSINESS_CITY}
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('[resend-invoice] Resend error:', emailError);
      return NextResponse.json({ error: `Erreur envoi email: ${emailError.message}` }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      invoiceNumber: invoiceRecord.invoice_number,
      bookingId: invoiceRecord.booking_id,
      sentTo: recipientEmail,
      resendMessageId: resendData?.id || null,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/resend-invoice:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
