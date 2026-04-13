import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPermission } from '@/lib/adminAuth';
import { GET as runGenerateInvoicesCron } from '@/app/api/cron/generate-invoices/route';

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET manquante' }, { status: 500 });
    }

    const internalUrl = new URL('/api/cron/generate-invoices', request.url);
    const internalRequest = new Request(internalUrl.toString(), {
      method: 'GET',
      headers: {
        authorization: `Bearer ${cronSecret}`,
      },
    });

    const cronResponse = await runGenerateInvoicesCron(internalRequest);
    const payload = await cronResponse.json().catch(() => null);

    return NextResponse.json(
      payload ?? { message: 'Génération déclenchée' },
      { status: cronResponse.status }
    );
  } catch (error) {
    console.error('Error in POST /api/admin/generate-invoices:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
