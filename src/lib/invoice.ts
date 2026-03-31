import { jsPDF } from 'jspdf';

interface InvoiceData {
  invoiceNumber: string;
  nom: string;
  prenom: string;
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

export function generateInvoicePDF(data: InvoiceData): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  let y = 25;

  // --------------- EN-TÊTE SOCIÉTÉ ---------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SCI THERA NICE', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('19 rue Michelet – 06100 Nice', margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('TVA non applicable – art. 293 B du CGI', margin, y);
  doc.setTextColor(0);
  y += 5;
  doc.text('SIRET : 990 302 887 00016', margin, y);
  doc.setTextColor(0);

  // --------------- LIGNE DE SÉPARATION ---------------
  y += 8;
  doc.setDrawColor(212, 163, 115); // #D4A373
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // --------------- BLOC FACTURÉ À + NUMÉRO FACTURE ---------------
  const leftCol = margin;
  const rightCol = 120;

  // Facturé à
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FACTURÉ À', leftCol, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${data.prenom} ${data.nom}`, leftCol, y);

  // Numéro facture (colonne droite)
  const yFacture = y - 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`FACTURE N° ${data.invoiceNumber}`, rightCol, yFacture);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date d'émission : ${formatDateFR(data.dateEmission)}`, rightCol, yFacture + 6);
  doc.text(`Date de prestation : ${formatDateFR(data.datePrestation)}`, rightCol, yFacture + 12);

  y += 18;

  // --------------- LIGNE DE SÉPARATION ---------------
  doc.setDrawColor(212, 163, 115);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // --------------- DÉTAIL DE LA PRESTATION ---------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DÉTAIL', leftCol, y);
  y += 8;

  const roomLabel = ROOM_LABELS[data.room] || data.room;
  const slotLabel = SLOT_LABELS[data.slot] || data.slot;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Mise à disposition temporaire d'espace professionnel – ${roomLabel}`, leftCol, y);
  y += 6;
  doc.text(`${formatDateFR(data.datePrestation)} – ${slotLabel}`, leftCol, y);
  y += 14;

  // --------------- MONTANTS ---------------
  // Ligne Montant HT
  doc.setFontSize(10);
  doc.text('Montant HT :', leftCol + 20, y);
  doc.text(`${data.amountHT.toFixed(2)} €`, pageWidth - margin, y, { align: 'right' });
  y += 7;

  // Ligne TVA
  doc.text('TVA :', leftCol + 20, y);
  doc.text('0 €', pageWidth - margin, y, { align: 'right' });
  y += 7;

  // Ligne Total TTC (en gras)
  doc.setFont('helvetica', 'bold');
  doc.text('Total TTC :', leftCol + 20, y);
  doc.text(`${data.amountHT.toFixed(2)} €`, pageWidth - margin, y, { align: 'right' });
  y += 14;

  // --------------- RÈGLEMENT ---------------
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(180, 90, 40); // Couleur dorée-brune
  doc.text(
    `Règlement effectué le ${formatDateLongFR(data.datePaiement)} – Carte bancaire`,
    leftCol,
    y
  );
  doc.setTextColor(0);

  // --------------- ENGAGEMENT SOLIDAIRE ---------------
  y += 20;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(120);
  const solidariteText = 'Dans le cadre de l\'engagement solidaire de THÉRANICE, 1 € est reversé à la Ligue contre le Cancer au titre de cette réservation.';
  const splitLines = doc.splitTextToSize(solidariteText, contentWidth);
  doc.text(splitLines, leftCol, y);
  doc.setTextColor(0);

  // --------------- GÉNÉRATION DU BUFFER ---------------
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}
