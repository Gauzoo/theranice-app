import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateInvoicePDF } from '@/lib/invoice';
import {
  SLOT_END_HOURS,
  ROOM_LABELS_FORMAL,
  EMAIL_FROM,
  BUSINESS_ADDRESS,
  BUSINESS_POSTAL_CODE,
  BUSINESS_CITY,
  type Slot,
} from '@/lib/constants';

type InvoiceResult = {
  bookingId: string;
  invoiceNumber: string;
  status: 'success' | 'error';
  stage?: 'profile' | 'pdf' | 'insert' | 'email';
  invoiceCreated?: boolean;
  emailTo?: string;
  emailStatus?: 'sent' | 'failed';
  error?: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Erreur inconnue';
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  return normalized || null;
}

export async function GET(request: Request) {
  try {
    // Vérifie l'authentification : Bearer token OU header Vercel cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isVercelCron = request.headers.get('x-vercel-cron-auth-token') === cronSecret;
    const isBearerAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!cronSecret || (!isVercelCron && !isBearerAuth)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Date/heure actuelle en timezone Paris
    const parisTime = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' })
    );
    const currentHour = parisTime.getHours();
    const todayStr = parisTime.toISOString().split('T')[0];

    // Récupérer les bookings confirmés dont la prestation est passée
    // et qui n'ont pas encore de facture
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, date, slot, room, price, user_id')
      .eq('status', 'confirmed')
      .lte('date', todayStr)
      .order('date', { ascending: true });

    if (fetchError) {
      console.error('Error fetching bookings:', fetchError);
      return NextResponse.json({ error: 'Erreur récupération réservations' }, { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ generated: 0, message: 'Aucune réservation à facturer' });
    }

    // Filtrer : ne garder que ceux dont le créneau est terminé
    const eligibleBookings = bookings.filter((booking) => {
      if (booking.date < todayStr) return true; // Dates passées
      if (booking.date === todayStr) {
        const slotEndHour = SLOT_END_HOURS[booking.slot as Slot] || 18;
        return currentHour >= slotEndHour;
      }
      return false;
    });

    if (eligibleBookings.length === 0) {
      return NextResponse.json({ generated: 0, message: 'Aucun créneau terminé à facturer' });
    }

    // Vérifier lesquels n'ont pas encore de facture
    const bookingIds = eligibleBookings.map((b) => b.id);
    const { data: existingInvoices, error: existingInvoicesError } = await supabase
      .from('invoices')
      .select('booking_id')
      .in('booking_id', bookingIds);

    if (existingInvoicesError) {
      console.error('Error fetching existing invoices:', existingInvoicesError);
      return NextResponse.json({ error: 'Erreur récupération factures existantes' }, { status: 500 });
    }

    const invoicedBookingIds = new Set(
      (existingInvoices || []).map((i) => i.booking_id)
    );

    const toInvoice = eligibleBookings.filter(
      (b) => !invoicedBookingIds.has(b.id)
    );

    if (toInvoice.length === 0) {
      return NextResponse.json({ generated: 0, message: 'Toutes les factures déjà générées' });
    }

    // Récupérer les profils des utilisateurs concernés
    const userIds = [...new Set(toInvoice.map((b) => b.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nom, prenom, adresse, siret')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Erreur récupération profils' }, { status: 500 });
    }

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    // Déterminer le prochain numéro de facture
    const year = parisTime.getFullYear();
    const prefix = `${year}-`;

    const { data: lastInvoice, error: lastInvoiceError } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `${prefix}%`)
      .order('invoice_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastInvoiceError) {
      console.error('Error fetching last invoice number:', lastInvoiceError);
      return NextResponse.json({ error: 'Erreur récupération dernier numéro de facture' }, { status: 500 });
    }

    let nextNumber = 1;
    if (lastInvoice?.invoice_number) {
      const lastNumStr = lastInvoice.invoice_number.replace(prefix, '');
      const lastNum = parseInt(lastNumStr, 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    // Initialiser Resend si disponible
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const authEmailCache = new Map<string, string>();
    const resolveRecipientEmail = async (userId: string): Promise<string | null> => {
      const cached = authEmailCache.get(userId);
      if (cached !== undefined) {
        return cached || null;
      }

      try {
        const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(userId);
        if (authUserError) {
          console.error(`[generate-invoices] Auth user fetch failed for ${userId}:`, authUserError);
          authEmailCache.set(userId, '');
          return null;
        }

        const email = normalizeEmail(authUserData.user?.email);
        authEmailCache.set(userId, email || '');
        return email;
      } catch (error) {
        console.error(`[generate-invoices] Unexpected auth lookup error for ${userId}:`, error);
        authEmailCache.set(userId, '');
        return null;
      }
    };

    const results: InvoiceResult[] = [];

    // Générer les factures dans l'ordre chronologique
    for (const booking of toInvoice) {
      const profile = profileMap.get(booking.user_id);
      if (!profile) {
        console.error(`[generate-invoices] Missing profile for booking ${booking.id} (user ${booking.user_id})`);
        results.push({
          bookingId: booking.id,
          invoiceNumber: '',
          status: 'error',
          stage: 'profile',
          error: 'Profil introuvable',
        });
        continue;
      }

      const invoiceNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;
      const today = parisTime.toISOString().split('T')[0];

      try {
        const recipientEmail = await resolveRecipientEmail(booking.user_id);

        // Générer le PDF
        const pdfBuffer = generateInvoicePDF({
          invoiceNumber,
          nom: profile.nom || '',
          prenom: profile.prenom || '',
          clientAdresse: profile.adresse || '',
          clientSiret: profile.siret || '',
          dateEmission: today,
          datePrestation: booking.date,
          datePaiement: booking.date,
          room: booking.room,
          slot: booking.slot,
          amountHT: Number(booking.price),
        });

        // Insérer en base
        const { error: insertError } = await supabase.from('invoices').insert({
          booking_id: booking.id,
          user_id: booking.user_id,
          invoice_number: invoiceNumber,
          amount_ht: Number(booking.price),
          amount_ttc: Number(booking.price),
          date_emission: today,
          date_prestation: booking.date,
          date_paiement: booking.date,
          room: booking.room,
          slot: booking.slot,
          nom: profile.nom,
          prenom: profile.prenom,
        });

        if (insertError) {
          console.error(`[generate-invoices] Invoice insert failed for booking ${booking.id}:`, insertError);
          results.push({
            bookingId: booking.id,
            invoiceNumber,
            status: 'error',
            stage: 'insert',
            invoiceCreated: false,
            error: insertError.message,
          });
          continue;
        }

        // Le numéro est consommé dès que l'insertion est réussie.
        nextNumber++;

        if (!recipientEmail) {
          console.error(`[generate-invoices] Recipient email not found for booking ${booking.id} (user ${booking.user_id})`);
          results.push({
            bookingId: booking.id,
            invoiceNumber,
            status: 'error',
            stage: 'email',
            invoiceCreated: true,
            emailStatus: 'failed',
            error: 'Email client introuvable dans auth.users',
          });
          continue;
        }

        if (!resend) {
          console.error(`[generate-invoices] RESEND_API_KEY missing while sending invoice ${invoiceNumber} for booking ${booking.id}`);
          results.push({
            bookingId: booking.id,
            invoiceNumber,
            status: 'error',
            stage: 'email',
            invoiceCreated: true,
            emailStatus: 'failed',
            emailTo: recipientEmail,
            error: 'RESEND_API_KEY manquante',
          });
          continue;
        }

        // Envoyer l'email avec le PDF
        const roomLabel = ROOM_LABELS_FORMAL[booking.room as keyof typeof ROOM_LABELS_FORMAL] || booking.room;
        const prestationDate = new Date(booking.date + 'T00:00:00');
        const formattedDate = prestationDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const formattedPaiement = prestationDate.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });

        const { error: emailError } = await resend.emails.send({
          from: EMAIL_FROM,
          to: [recipientEmail],
          subject: `Votre facture – THÉRANICE`,
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
                
                <div style="background: linear-gradient(135deg, #D4A373 0%, #c39363 100%); color: white; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">THÉRANICE</h1>
                  <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Votre facture</p>
                </div>
                
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none;">
                  
                  <p>Madame, Monsieur,</p>
                  
                  <p>Nous vous prions de bien vouloir trouver ci-joint la facture n° <strong>${invoiceNumber}</strong> relative à la mise à disposition temporaire d'espace professionnel intervenue le <strong>${formattedDate}</strong>.</p>
                  
                  <p>Nous vous confirmons que le règlement a été enregistré le <strong>${formattedPaiement}</strong> par <strong>carte bancaire</strong>.</p>
                  
                  <p>Conservez cet email et la facture jointe pour votre comptabilité.</p>
                  
                  <p>Nous vous remercions de la confiance accordée à THÉRANICE et restons à votre disposition pour toute information complémentaire.</p>
                  
                  <p style="font-size: 13px; color: #666; margin-top: 20px;">
                    Dans le cadre de notre engagement solidaire, 1 € sera reversé à la Ligue contre le Cancer au titre de cette réservation.
                  </p>
                  
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
                
                <div style="text-align: center; color: #999; font-size: 12px; padding: 20px;">
                  <p>© ${new Date().getFullYear()} THÉRANICE – Tous droits réservés</p>
                </div>
              </body>
            </html>
          `,
        });

        if (emailError) {
          console.error(`[generate-invoices] Email send failed for invoice ${invoiceNumber} (booking ${booking.id}):`, emailError);
          results.push({
            bookingId: booking.id,
            invoiceNumber,
            status: 'error',
            stage: 'email',
            invoiceCreated: true,
            emailTo: recipientEmail,
            emailStatus: 'failed',
            error: emailError.message,
          });
          continue;
        }

        results.push({
          bookingId: booking.id,
          invoiceNumber,
          status: 'success',
          stage: 'email',
          invoiceCreated: true,
          emailTo: recipientEmail,
          emailStatus: 'sent',
        });
      } catch (err) {
        console.error(`[generate-invoices] PDF/render failure for booking ${booking.id}:`, err);
        results.push({
          bookingId: booking.id,
          invoiceNumber,
          status: 'error',
          stage: 'pdf',
          invoiceCreated: false,
          error: getErrorMessage(err),
        });
      }
    }

    const generated = results.filter((r) => r.invoiceCreated).length;
    const emailed = results.filter((r) => r.emailStatus === 'sent').length;
    const failed = results.filter((r) => r.status === 'error').length;

    console.log(`[generate-invoices] Generated: ${generated}, Emailed: ${emailed}, Failed: ${failed}`);

    return NextResponse.json({ generated, emailed, failed, results });
  } catch (err) {
    console.error('Generate invoices cron error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
