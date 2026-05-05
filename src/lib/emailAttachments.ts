import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

type EmailAttachment = {
  filename: string;
  content: string;
  contentType: string;
};

const BOOKING_CONFIRMATION_PDF = path.join(
  process.cwd(),
  'public',
  'doc',
  'Consignes_Theranice.pdf'
);

const MAX_BOOKING_CONFIRMATION_PDF_BYTES = 25 * 1024 * 1024;

export async function getBookingConfirmationAttachments(): Promise<EmailAttachment[]> {
  const fileStats = await stat(BOOKING_CONFIRMATION_PDF).catch((error: unknown) => {
    throw new Error(
      `Booking confirmation attachment is unavailable at ${BOOKING_CONFIRMATION_PDF}: ${String(error)}`
    );
  });

  if (!fileStats.isFile()) {
    throw new Error(`Booking confirmation attachment is not a file: ${BOOKING_CONFIRMATION_PDF}`);
  }

  if (fileStats.size <= 0) {
    throw new Error(`Booking confirmation attachment is empty: ${BOOKING_CONFIRMATION_PDF}`);
  }

  if (fileStats.size > MAX_BOOKING_CONFIRMATION_PDF_BYTES) {
    throw new Error(
      `Booking confirmation attachment exceeds size limit (${fileStats.size} bytes): ${BOOKING_CONFIRMATION_PDF}`
    );
  }

  if (path.extname(BOOKING_CONFIRMATION_PDF).toLowerCase() !== '.pdf') {
    throw new Error(`Booking confirmation attachment must be a PDF: ${BOOKING_CONFIRMATION_PDF}`);
  }

  const fileBuffer = await readFile(BOOKING_CONFIRMATION_PDF);

  if (fileBuffer.length < 5 || fileBuffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error(`Booking confirmation attachment is not a valid PDF file: ${BOOKING_CONFIRMATION_PDF}`);
  }

  return [
    {
      filename: path.basename(BOOKING_CONFIRMATION_PDF),
      content: fileBuffer.toString('base64'),
      contentType: 'application/pdf',
    },
  ];
}