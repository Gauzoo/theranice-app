import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPermission } from '@/lib/adminAuth';
import {
  type AccountStatus,
  type DocumentType,
  DOCUMENT_LABELS,
  buildAccountStatusFields,
  buildDocumentStatusPatch,
  deriveProfileVerificationState,
} from '@/lib/profileVerification';

interface ProfileValidationRow {
  nom: string | null;
  prenom: string | null;
  account_status: AccountStatus | null;
  documents_submitted_at: string | null;
  activite_exercee: string | null;
  carte_identite_url: string | null;
  kbis_url: string | null;
  rc_pro_url: string | null;
  carte_identite_status: string | null;
  kbis_status: string | null;
  rc_pro_status: string | null;
  carte_identite_rejection_notes: string | null;
  kbis_rejection_notes: string | null;
  rc_pro_rejection_notes: string | null;
}

const PROFILE_VALIDATION_SELECT =
  'nom,prenom,account_status,documents_submitted_at,activite_exercee,carte_identite_url,kbis_url,rc_pro_url,carte_identite_status,kbis_status,rc_pro_status,carte_identite_rejection_notes,kbis_rejection_notes,rc_pro_rejection_notes' as const;

function getDocumentRejectionNote(profile: ProfileValidationRow, type: DocumentType): string {
  if (type === 'carte') {
    return profile.carte_identite_rejection_notes?.trim() || '';
  }

  if (type === 'kbis') {
    return profile.kbis_rejection_notes?.trim() || '';
  }

  return profile.rc_pro_rejection_notes?.trim() || '';
}

function buildGlobalRejectionSummary(profile: ProfileValidationRow, rejectedDocuments: DocumentType[]): string {
  if (rejectedDocuments.length === 0) {
    return 'Un ou plusieurs documents fournis ne sont pas conformes.';
  }

  if (rejectedDocuments.length === 1) {
    const singleNote = getDocumentRejectionNote(profile, rejectedDocuments[0]);
    return singleNote || 'Un document fourni n\'est pas conforme.';
  }

  const reasons = rejectedDocuments.map((type) => {
    const label = DOCUMENT_LABELS[type];
    const note = getDocumentRejectionNote(profile, type);
    return note ? `${label}: ${note}` : `${label}: motif non renseigne`;
  });

  return reasons.join('\n');
}

function buildFullName(profile: ProfileValidationRow): string {
  const fullName = `${profile.prenom || ''} ${profile.nom || ''}`.trim();
  return fullName || 'Utilisateur Theranice';
}

async function sendAccountDecisionEmail(
  request: NextRequest,
  accountStatus: 'approved' | 'rejected',
  userEmail: string,
  userName: string,
  rejectionNotes?: string
): Promise<{ emailSent: boolean; emailError: string | null }> {
  const endpoint = accountStatus === 'approved'
    ? '/api/emails/account-approved'
    : '/api/emails/account-rejected';

  const payload = accountStatus === 'approved'
    ? {
        userEmail,
        userName,
      }
    : {
        userEmail,
        userName,
        rejectionNotes: rejectionNotes || 'Un ou plusieurs documents fournis ne sont pas conformes.',
      };

  try {
    const response = await fetch(new URL(endpoint, request.nextUrl.origin), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { emailSent: true, emailError: null };
    }

    const errorBody = await response.json().catch(() => ({} as { error?: string }));
    return {
      emailSent: false,
      emailError: errorBody.error || `Email endpoint returned status ${response.status}`,
    };
  } catch (error) {
    return {
      emailSent: false,
      emailError: error instanceof Error ? error.message : 'Unknown email error',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérification de sécurité CRITIQUE
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, documentType, action, notes } = await request.json();

    if (!userId || !documentType || !action) {
      return NextResponse.json(
        { error: 'userId, documentType et action sont requis' },
        { status: 400 }
      );
    }

    if (!['carte', 'kbis', 'rc_pro'].includes(documentType)) {
      return NextResponse.json(
        { error: 'documentType doit être "carte", "kbis" ou "rc_pro"' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action doit être "approve" ou "reject"' },
        { status: 400 }
      );
    }

    const cleanedNotes = typeof notes === 'string' ? notes.trim() : '';
    if (action === 'reject' && !cleanedNotes) {
      return NextResponse.json(
        { error: 'La raison du refus est obligatoire' },
        { status: 400 }
      );
    }

    // Utilise la service_role_key pour bypasser RLS
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

    const statusField = documentType === 'carte' ? 'carte_identite_status' : documentType === 'kbis' ? 'kbis_status' : 'rc_pro_status';
    const notesField = documentType === 'carte' ? 'carte_identite_rejection_notes' : documentType === 'kbis' ? 'kbis_rejection_notes' : 'rc_pro_rejection_notes';
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { data: profileBefore, error: profileBeforeError } = await supabaseAdmin
      .from('profiles')
      .select(PROFILE_VALIDATION_SELECT)
      .eq('id', userId)
      .single();

    if (profileBeforeError || !profileBefore) {
      console.error('Error fetching profile before validation:', profileBeforeError);
      return NextResponse.json(
        { error: 'Profil introuvable' },
        { status: 404 }
      );
    }

    const previousDerivedState = deriveProfileVerificationState(profileBefore);
    const previousAccountStatus = buildAccountStatusFields(
      previousDerivedState,
      profileBefore.documents_submitted_at
    ).account_status;

    const updateData: Record<string, string | null> = {
      [statusField]: newStatus,
    };

    if (action === 'reject') {
      updateData[notesField] = cleanedNotes;
    } else if (action === 'approve') {
      updateData[notesField] = null; // Effacer les notes si le document est approuvé
    }

    // Met à jour le statut du document
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating document status:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du statut' },
        { status: 500 }
      );
    }

    // Recalcule le statut global et normalise les statuts documentaires
    const { data: profileAfterUpdate, error: profileAfterError } = await supabaseAdmin
      .from('profiles')
      .select(PROFILE_VALIDATION_SELECT)
      .eq('id', userId)
      .single();

    if (profileAfterError || !profileAfterUpdate) {
      console.error('Error fetching profile after validation:', profileAfterError);
      return NextResponse.json(
        { error: 'Erreur lors du recalcul du statut global' },
        { status: 500 }
      );
    }

    const derivedState = deriveProfileVerificationState(profileAfterUpdate);
    const normalizedStatuses = buildDocumentStatusPatch(derivedState);
    const accountStatusFields = buildAccountStatusFields(
      derivedState,
      profileAfterUpdate.documents_submitted_at
    );
    const nextAccountStatus = accountStatusFields.account_status;

    const globalRejectionSummary = nextAccountStatus === 'rejected'
      ? buildGlobalRejectionSummary(profileAfterUpdate, derivedState.rejectedDocuments)
      : null;

    const { error: normalizationError } = await supabaseAdmin
      .from('profiles')
      .update({
        ...normalizedStatuses,
        ...accountStatusFields,
        validation_notes: globalRejectionSummary,
      })
      .eq('id', userId);

    if (normalizationError) {
      console.error('Error normalizing profile status:', normalizationError);
      return NextResponse.json(
        { error: 'Erreur lors de la synchronisation du statut global' },
        { status: 500 }
      );
    }

    const notification = {
      triggered: false,
      emailType: null as 'approved' | 'rejected' | null,
      emailSent: false,
      emailError: null as string | null,
    };

    const isDecisionTransition = previousAccountStatus !== nextAccountStatus
      && (nextAccountStatus === 'approved' || nextAccountStatus === 'rejected');

    if (isDecisionTransition) {
      notification.triggered = true;
      notification.emailType = nextAccountStatus;

      const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authUserError) {
        notification.emailError = authUserError.message;
      }

      const userEmail = authUserData?.user?.email || '';
      if (!userEmail) {
        notification.emailError = notification.emailError || 'Email utilisateur introuvable';
      } else {
        const sendResult = await sendAccountDecisionEmail(
          request,
          nextAccountStatus,
          userEmail,
          buildFullName(profileAfterUpdate),
          globalRejectionSummary || undefined
        );
        notification.emailSent = sendResult.emailSent;
        notification.emailError = sendResult.emailError;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Document ${action === 'approve' ? 'approuve' : 'rejete'} avec succes`,
      accountStatus: nextAccountStatus,
      notification,
    });
  } catch (error) {
    console.error('Error in /api/admin/validate-document:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
