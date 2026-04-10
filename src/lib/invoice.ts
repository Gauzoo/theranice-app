import { jsPDF } from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';

interface InvoiceData {
  invoiceNumber: string;
  nom: string;
  prenom: string;
  clientAdresse: string;
  clientSiret: string;
  dateEmission: string;   // YYYY-MM-DD
  datePrestation: string;  // YYYY-MM-DD
  datePaiement: string;    // YYYY-MM-DD
  room: string;
  slot: string;
  amountHT: number;
}

const ROOM_LABELS: Record<string, string> = {
  room1: 'Salon Athéna',
  room2: 'Salle Gaïa',
  large: 'Grande salle',
};

const SLOT_LABELS: Record<string, string> = {
  morning: '7h30 – 13h',
  afternoon: '13h30 – 20h30',
  fullday: '7h30 – 20h30',
};

function formatDateFR(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateLongFR(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function loadLogo(): string | null {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo6sombre.png');
    const logoBuffer = fs.readFileSync(logoPath);
    return logoBuffer.toString('base64');
  } catch {
    return null;
  }
}

function splitBillingAddress(clientAdresse: string): { streetLine: string; postalCityLine: string } {
  const normalized = clientAdresse.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return { streetLine: '', postalCityLine: '' };
  }

  const commaIndex = normalized.indexOf(',');
  if (commaIndex >= 0) {
    return {
      streetLine: normalized.slice(0, commaIndex).trim(),
      postalCityLine: normalized.slice(commaIndex + 1).trim(),
    };
  }

  const postalCityMatch = normalized.match(/^(.*)\s(\d{5}\s+.+)$/);
  if (postalCityMatch) {
    return {
      streetLine: postalCityMatch[1].trim(),
      postalCityLine: postalCityMatch[2].trim(),
    };
  }

  return { streetLine: normalized, postalCityLine: '' };
}

function writeLine(
  doc: jsPDF,
  x: number,
  y: number,
  text: string,
  lineHeight = 5,
  options?: { align?: 'left' | 'center' | 'right' | 'justify' }
): number {
  doc.text(text, x, y, options);
  return y + lineHeight;
}

function drawHorizontalRule(
  doc: jsPDF,
  margin: number,
  pageWidth: number,
  y: number,
  color: [number, number, number],
  lineWidth: number
): void {
  doc.setDrawColor(...color);
  doc.setLineWidth(lineWidth);
  doc.line(margin, y, pageWidth - margin, y);
}

function writeAmountRow(
  doc: jsPDF,
  leftX: number,
  rightX: number,
  y: number,
  label: string,
  value: string,
  lineHeight = 7
): number {
  doc.text(label, leftX, y);
  doc.text(value, rightX, y, { align: 'right' });
  return y + lineHeight;
}

function formatAmountEUR(amount: number): string {
  return `${amount.toFixed(2)} €`;
}

export function generateInvoicePDF(data: InvoiceData): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // --------------- LOGO ---------------
  const logoBase64 = loadLogo();
  if (logoBase64) {
    const logoSize = 22;
    const logoX = (pageWidth - logoSize) / 2;
    doc.addImage(
      `data:image/png;base64,${logoBase64}`,
      'PNG',
      logoX,
      y,
      logoSize,
      logoSize
    );
    y += logoSize + 8;
  }

  // --------------- EN-TÊTE SOCIÉTÉ ---------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SCI THERA NICE', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y = writeLine(doc, pageWidth / 2, y, '19 rue Michelet – 06100 Nice', 5, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('TVA non applicable – art. 293 B du CGI', pageWidth / 2, y, { align: 'center' });
  doc.setTextColor(0);

  // --------------- LIGNE DE SÉPARATION ---------------
  y += 8;
  drawHorizontalRule(doc, margin, pageWidth, y, [212, 163, 115], 0.8);
  y += 12;

  // --------------- BLOC GAUCHE : FACTURÉ À ---------------
  const leftCol = margin;
  const rightCol = 120;
  const yBlockStart = y;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  y = writeLine(doc, leftCol, y, 'FACTURÉ À', 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const clientIdentity = `Mme/M. ${[data.prenom, data.nom].filter(Boolean).join(' ')}`.trim();

  const { streetLine, postalCityLine } = splitBillingAddress(data.clientAdresse);
  const billingLines = [
    clientIdentity,
    streetLine,
    postalCityLine,
    data.clientSiret ? `SIRET : ${data.clientSiret}` : '',
  ].filter(Boolean);

  for (const line of billingLines) {
    y = writeLine(doc, leftCol, y, line);
  }

  // --------------- BLOC DROIT : FACTURE N° ---------------
  let yRight = yBlockStart;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  yRight = writeLine(doc, rightCol, yRight, `FACTURE N° ${data.invoiceNumber}`, 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const rightBlockLines = [
    `Date d'émission : ${formatDateFR(data.dateEmission)}`,
    `Date de prestation : ${formatDateFR(data.datePrestation)}`,
  ];
  for (const line of rightBlockLines) {
    yRight = writeLine(doc, rightCol, yRight, line);
  }

  y = Math.max(y, yRight) + 8;

  // --------------- LIGNE DE SÉPARATION ---------------
  drawHorizontalRule(doc, margin, pageWidth, y, [212, 163, 115], 0.4);
  y += 10;

  // --------------- DÉTAIL DE LA PRESTATION ---------------
  const roomLabel = ROOM_LABELS[data.room] || data.room;
  const slotLabel = SLOT_LABELS[data.slot] || data.slot;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  y = writeLine(doc, leftCol, y, 'DÉTAIL DE LA PRESTATION', 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const serviceDetailLines = [
    `Mise à disposition temporaire d'espace professionnel – ${roomLabel}`,
    `- ${formatDateFR(data.datePrestation)} – ${slotLabel}`,
  ];
  y = writeLine(doc, leftCol, y, serviceDetailLines[0], 7);
  y = writeLine(doc, leftCol, y, serviceDetailLines[1], 14);

  // --------------- MONTANTS ---------------
  doc.setFontSize(10);
  const amountLabelX = pageWidth - margin;
  y = writeAmountRow(doc, leftCol, amountLabelX, y, 'Montant HT :', formatAmountEUR(data.amountHT));
  y = writeAmountRow(doc, leftCol, amountLabelX, y, 'TVA :', 'Non applicable – art. 293 B du CGI');

  doc.setFont('helvetica', 'bold');
  y = writeAmountRow(doc, leftCol, amountLabelX, y, 'Total TTC :', formatAmountEUR(data.amountHT), 14);

  // --------------- RÈGLEMENT ---------------
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `Règlement effectué le ${formatDateLongFR(data.datePaiement)} – Carte bancaire`,
    leftCol,
    y
  );

  // --------------- ENGAGEMENT SOLIDAIRE ---------------
  y += 16;
  drawHorizontalRule(doc, margin, pageWidth, y, [200, 200, 200], 0.3);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(120);
  const solidariteText = 'Dans le cadre de l\'engagement solidaire de THÉRANICE, 1 € est reversé à la Ligue contre le Cancer au titre de cette réservation.';
  const splitLines = doc.splitTextToSize(solidariteText, contentWidth);
  doc.text(splitLines, leftCol, y);
  doc.setTextColor(0);

  // --------------- GÉNÉRATION DU BUFFER ---------------
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}
