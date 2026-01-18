import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPermission } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    // Vérification de sécurité CRITIQUE
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const fileType = searchParams.get('fileType'); // 'carte' ou 'kbis'

    if (!userId || !fileType) {
      return NextResponse.json(
        { error: 'userId et fileType sont requis' },
        { status: 400 }
      );
    }

    if (!['carte', 'kbis'].includes(fileType)) {
      return NextResponse.json(
        { error: 'fileType doit être "carte" ou "kbis"' },
        { status: 400 }
      );
    }

    // Utilise la service_role_key pour accéder aux documents
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Liste les fichiers dans le dossier de l'utilisateur
    const { data: files, error: listError } = await supabaseAdmin
      .storage
      .from('user-documents')
      .list(userId);

    if (listError) {
      console.error('Error listing files:', listError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des fichiers' },
        { status: 500 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Aucun fichier trouvé' },
        { status: 404 }
      );
    }

    // Trouve le fichier correspondant (carte-identite.* ou kbis.*)
    const prefix = fileType === 'carte' ? 'carte-identite' : 'kbis';
    const file = files.find(f => f.name.startsWith(prefix));

    if (!file) {
      return NextResponse.json(
        { error: `Fichier ${fileType} non trouvé` },
        { status: 404 }
      );
    }

    const filePath = `${userId}/${file.name}`;

    // Génère une URL signée valide pendant 60 secondes
    const { data: signedUrlData, error: signedError } = await supabaseAdmin
      .storage
      .from('user-documents')
      .createSignedUrl(filePath, 60);

    if (signedError || !signedUrlData) {
      console.error('Error creating signed URL:', signedError);
      return NextResponse.json(
        { error: 'Erreur lors de la génération de l\'URL' },
        { status: 500 }
      );
    }

    // Redirige vers l'URL signée
    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch (error) {
    console.error('Error in /api/admin/view-document:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
