import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPermission } from '@/lib/adminAuth';

type DocumentType = 'carte' | 'kbis' | 'rc_pro';
type AccountStatus = 'pending' | 'documents_submitted' | 'approved' | 'rejected';

const DOCUMENT_BUCKET = 'user-documents';
const MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const DOCUMENT_FIELDS: Record<DocumentType, {
  urlField: 'carte_identite_url' | 'kbis_url' | 'rc_pro_url';
  statusField: 'carte_identite_status' | 'kbis_status' | 'rc_pro_status';
  notesField: 'carte_identite_rejection_notes' | 'kbis_rejection_notes' | 'rc_pro_rejection_notes';
  filePrefix: string;
}> = {
  carte: {
    urlField: 'carte_identite_url',
    statusField: 'carte_identite_status',
    notesField: 'carte_identite_rejection_notes',
    filePrefix: 'carte-identite',
  },
  kbis: {
    urlField: 'kbis_url',
    statusField: 'kbis_status',
    notesField: 'kbis_rejection_notes',
    filePrefix: 'kbis',
  },
  rc_pro: {
    urlField: 'rc_pro_url',
    statusField: 'rc_pro_status',
    notesField: 'rc_pro_rejection_notes',
    filePrefix: 'rc-pro',
  },
};

const createSupabaseAdminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const getExtensionFromMime = (mimeType: string) => {
  switch (mimeType) {
    case 'application/pdf':
      return 'pdf';
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return '';
  }
};

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

const deriveAccountStatus = (profile: {
  carte_identite_url: string | null;
  kbis_url: string | null;
  rc_pro_url: string | null;
  carte_identite_status: string | null;
  kbis_status: string | null;
  rc_pro_status: string | null;
}): { accountStatus: AccountStatus; validatedAt: string | null } => {
  const hasAllDocuments = Boolean(
    profile.carte_identite_url && profile.kbis_url && profile.rc_pro_url
  );

  if (!hasAllDocuments) {
    return { accountStatus: 'pending', validatedAt: null };
  }

  const documentStatuses = [
    profile.carte_identite_status,
    profile.kbis_status,
    profile.rc_pro_status,
  ];

  if (documentStatuses.every((status) => status === 'approved')) {
    return {
      accountStatus: 'approved',
      validatedAt: new Date().toISOString(),
    };
  }

  if (documentStatuses.some((status) => status === 'rejected')) {
    return { accountStatus: 'rejected', validatedAt: null };
  }

  return { accountStatus: 'documents_submitted', validatedAt: null };
};

const parseDocumentType = (value: unknown): DocumentType | null => {
  if (value === 'carte' || value === 'kbis' || value === 'rc_pro') {
    return value;
  }
  return null;
};

const fetchProfileForDocuments = async (
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string
) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, carte_identite_url, kbis_url, rc_pro_url, carte_identite_status, kbis_status, rc_pro_status')
    .eq('id', userId)
    .single();

  if (error) {
    return { error, profile: null };
  }

  return { error: null, profile: data };
};

const updateAccountStatusFromProfile = async (
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  profile: {
    carte_identite_url: string | null;
    kbis_url: string | null;
    rc_pro_url: string | null;
    carte_identite_status: string | null;
    kbis_status: string | null;
    rc_pro_status: string | null;
  }
) => {
  const { accountStatus, validatedAt } = deriveAccountStatus(profile);

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      account_status: accountStatus,
      validated_at: validatedAt,
    })
    .eq('id', userId);

  return { accountStatus, error };
};

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const userId = typeof formData.get('userId') === 'string' ? String(formData.get('userId')) : '';
    const documentType = parseDocumentType(formData.get('documentType'));
    const fileEntry = formData.get('file');

    if (!userId || !documentType) {
      return NextResponse.json(
        { error: 'userId et documentType sont requis' },
        { status: 400 }
      );
    }

    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        { error: 'Fichier invalide' },
        { status: 400 }
      );
    }

    if (fileEntry.size <= 0 || fileEntry.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Le fichier doit être compris entre 1 octet et 6 Mo' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(fileEntry.type)) {
      return NextResponse.json(
        { error: 'Format de fichier non autorisé (PDF, JPG, PNG, WEBP)' },
        { status: 400 }
      );
    }

    const extension = getExtensionFromMime(fileEntry.type);
    if (!extension) {
      return NextResponse.json(
        { error: 'Impossible de détecter l\'extension du fichier' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { error: profileError, profile } = await fetchProfileForDocuments(supabaseAdmin, userId);

    if (profileError || !profile) {
      console.error('Error fetching profile before upload:', profileError);
      return NextResponse.json(
        { error: 'Profil introuvable' },
        { status: 404 }
      );
    }

    const documentConfig = DOCUMENT_FIELDS[documentType];
    const existingReference = profile[documentConfig.urlField];
    const existingPath = extractStoragePath(existingReference);

    if (existingPath) {
      const { error: removeError } = await supabaseAdmin.storage
        .from(DOCUMENT_BUCKET)
        .remove([existingPath]);

      if (removeError && !removeError.message.toLowerCase().includes('not found')) {
        console.error('Error deleting existing document before replacement:', removeError);
      }
    }

    const uploadPath = `${userId}/${documentConfig.filePrefix}-${Date.now()}.${extension}`;
    const arrayBuffer = await fileEntry.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from(DOCUMENT_BUCKET)
      .upload(uploadPath, arrayBuffer, {
        contentType: fileEntry.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading admin document:', uploadError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload du document' },
        { status: 500 }
      );
    }

    const profileUpdatePayload: Record<string, string | null> = {
      [documentConfig.urlField]: uploadPath,
      [documentConfig.statusField]: 'pending',
      [documentConfig.notesField]: null,
    };

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdatePayload)
      .eq('id', userId)
      .select('carte_identite_url, kbis_url, rc_pro_url, carte_identite_status, kbis_status, rc_pro_status')
      .single();

    if (updateError || !updatedProfile) {
      console.error('Error updating profile after admin upload:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du profil' },
        { status: 500 }
      );
    }

    const { accountStatus, error: accountStatusError } = await updateAccountStatusFromProfile(
      supabaseAdmin,
      userId,
      updatedProfile
    );

    if (accountStatusError) {
      console.error('Error updating account status after document upload:', accountStatusError);
      return NextResponse.json(
        { error: 'Document uploadé mais impossible de mettre à jour le statut du compte' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document uploadé avec succès',
      filePath: uploadPath,
      accountStatus,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/member-document:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, documentType } = await request.json();
    const safeDocumentType = parseDocumentType(documentType);

    if (!userId || !safeDocumentType) {
      return NextResponse.json(
        { error: 'userId et documentType sont requis' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { error: profileError, profile } = await fetchProfileForDocuments(supabaseAdmin, userId);

    if (profileError || !profile) {
      console.error('Error fetching profile before delete:', profileError);
      return NextResponse.json(
        { error: 'Profil introuvable' },
        { status: 404 }
      );
    }

    const documentConfig = DOCUMENT_FIELDS[safeDocumentType];
    const existingReference = profile[documentConfig.urlField];

    if (!existingReference) {
      return NextResponse.json({
        success: true,
        message: 'Aucun document à supprimer',
      });
    }

    const existingPath = extractStoragePath(existingReference);
    if (existingPath) {
      const { error: removeError } = await supabaseAdmin.storage
        .from(DOCUMENT_BUCKET)
        .remove([existingPath]);

      if (removeError && !removeError.message.toLowerCase().includes('not found')) {
        console.error('Error deleting admin document:', removeError);
        return NextResponse.json(
          { error: 'Erreur lors de la suppression du fichier dans le stockage' },
          { status: 500 }
        );
      }
    }

    const profileUpdatePayload: Record<string, null> = {
      [documentConfig.urlField]: null,
      [documentConfig.statusField]: null,
      [documentConfig.notesField]: null,
    };

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdatePayload)
      .eq('id', userId)
      .select('carte_identite_url, kbis_url, rc_pro_url, carte_identite_status, kbis_status, rc_pro_status')
      .single();

    if (updateError || !updatedProfile) {
      console.error('Error updating profile after admin document delete:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du profil' },
        { status: 500 }
      );
    }

    const { accountStatus, error: accountStatusError } = await updateAccountStatusFromProfile(
      supabaseAdmin,
      userId,
      updatedProfile
    );

    if (accountStatusError) {
      console.error('Error updating account status after delete:', accountStatusError);
      return NextResponse.json(
        { error: 'Document supprimé mais impossible de mettre à jour le statut du compte' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document supprimé avec succès',
      accountStatus,
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/member-document:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
