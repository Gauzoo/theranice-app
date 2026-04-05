import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPermission } from '@/lib/adminAuth';

const DOCUMENT_BUCKET = 'user-documents';

const extractStoragePath = (rawReference: string | null | undefined) => {
  if (!rawReference || typeof rawReference !== 'string') {
    return null;
  }

  const trimmed = rawReference.trim();
  if (!trimmed) {
    return null;
  }

  if (!trimmed.includes('://')) {
    return trimmed;
  }

  try {
    const parsedUrl = new URL(trimmed);
    const signedTokenPath = parsedUrl.searchParams.get('path');
    if (signedTokenPath) {
      return decodeURIComponent(signedTokenPath);
    }

    const marker = '/storage/v1/object/';
    const markerIndex = parsedUrl.pathname.indexOf(marker);
    if (markerIndex === -1) {
      return null;
    }

    const storageSegment = parsedUrl.pathname.slice(markerIndex + marker.length);
    const cleanedSegment = storageSegment.startsWith('public/')
      ? storageSegment.slice('public/'.length)
      : storageSegment;

    const expectedPrefix = `${DOCUMENT_BUCKET}/`;
    if (!cleanedSegment.startsWith(expectedPrefix)) {
      return null;
    }

    return decodeURIComponent(cleanedSegment.slice(expectedPrefix.length));
  } catch {
    return null;
  }
};

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

    if (!['carte', 'kbis', 'rc_pro'].includes(fileType)) {
      return NextResponse.json(
        { error: 'fileType doit être "carte", "kbis" ou "rc_pro"' },
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

    const urlField = fileType === 'carte' ? 'carte_identite_url' : fileType === 'kbis' ? 'kbis_url' : 'rc_pro_url';

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(urlField)
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile document field:', profileError);
      return NextResponse.json(
        { error: 'Profil introuvable' },
        { status: 404 }
      );
    }

    let filePath = extractStoragePath(profile?.[urlField as keyof typeof profile] as string | null | undefined);

    // Fallback rétrocompatibilité pour les anciens comptes sans chemin enregistré.
    if (!filePath) {
      const { data: files, error: listError } = await supabaseAdmin
        .storage
        .from(DOCUMENT_BUCKET)
        .list(userId);

      if (listError) {
        console.error('Error listing files fallback:', listError);
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

      const prefix = fileType === 'carte' ? 'carte-identite' : fileType === 'kbis' ? 'kbis' : 'rc-pro';
      const file = files
        .filter((entry) => entry.name.startsWith(prefix))
        .sort((a, b) => a.name.localeCompare(b.name))
        .pop();

      if (!file) {
        return NextResponse.json(
          { error: `Fichier ${fileType} non trouvé` },
          { status: 404 }
        );
      }

      filePath = `${userId}/${file.name}`;
    }

    // Génère une URL signée valide pendant 60 secondes
    const { data: signedUrlData, error: signedError } = await supabaseAdmin
      .storage
      .from(DOCUMENT_BUCKET)
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
