import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPermission } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  try {
    // Vérification de sécurité CRITIQUE
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await request.json().catch(() => null);

    return NextResponse.json(
      {
        error: 'Action depreciee. Utilisez /api/admin/validate-document pour gerer la revue des comptes.',
      },
      { status: 410 }
    );
  } catch (error) {
    console.error('Error in /api/admin/validate-account:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
