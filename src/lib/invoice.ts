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
  morning: '8h – 12h',
  afternoon: '13h – 17h',
  fullday: '8h – 17h',
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
  doc.text('19 rue Michelet – 06100 Nice', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('TVA non applicable – art. 293 B du CGI', pageWidth / 2, y, { align: 'center' });
  doc.setTextColor(0);

  // --------------- LIGNE DE SÉPARATION ---------------
  y += 8;
  doc.setDrawColor(212, 163, 115);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // --------------- BLOC GAUCHE : FACTURÉ À ---------------
  const leftCol = margin;
  const rightCol = 120;
  const yBlockStart = y;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FACTURÉ À', leftCol, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nom : ${data.nom}`, leftCol, y);
  y += 5;
  doc.text(`Prénom : ${data.prenom}`, leftCol, y);
  y += 5;

  if (data.clientAdresse) {
    const adresseLines = doc.splitTextToSize(`Adresse : ${data.clientAdresse}`, 85);
    doc.text(adresseLines, leftCol, y);
    y += adresseLines.length * 5;
  }

  if (data.clientSiret) {
    doc.text(`SIRET : ${data.clientSiret}`, leftCol, y);
    y += 5;
  }

  // --------------- BLOC DROIT : FACTURE N° ---------------
  let yRight = yBlockStart;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`FACTURE N° ${data.invoiceNumber}`, rightCol, yRight);
  yRight += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Date d'émission : ${formatDateFR(data.dateEmission)}`, rightCol, yRight);
  yRight += 5;
  doc.text('Date de prestation :', rightCol, yRight);
  yRight += 5;
  doc.text(formatDateFR(data.datePrestation), rightCol, yRight);

  y = Math.max(y, yRight + 5) + 8;

  // --------------- LIGNE DE SÉPARATION ---------------
  doc.setDrawColor(212, 163, 115);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // --------------- DÉTAIL DE LA PRESTATION ---------------
  const roomLabel = ROOM_LABELS[data.room] || data.room;
  const slotLabel = SLOT_LABELS[data.slot] || data.slot;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DÉTAIL DE LA PRESTATION', leftCol, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const descriptionLines = doc.splitTextToSize(
    `Mise à disposition temporaire d'espace professionnel – ${roomLabel}`,
    contentWidth
  );
  doc.text(descriptionLines, leftCol, y);
  y += descriptionLines.length * 5 + 2;

  doc.text(`- ${formatDateFR(data.datePrestation)} – ${slotLabel}`, leftCol, y);
  y += 14;

  // --------------- MONTANTS ---------------
  doc.setFontSize(10);
  doc.text('Montant HT :', leftCol, y);
  doc.text(`${data.amountHT.toFixed(2)} €`, pageWidth - margin, y, { align: 'right' });
  y += 7;

  doc.text('TVA :', leftCol, y);
  doc.text('Non applicable – art. 293 B du CGI', pageWidth - margin, y, { align: 'right' });
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('Total TTC :', leftCol, y);
  doc.text(`${data.amountHT.toFixed(2)} €`, pageWidth - margin, y, { align: 'right' });
  y += 14;

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
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
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
