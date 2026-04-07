import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPermission } from '@/lib/adminAuth';
import {
  buildAccountStatusFields,
  buildDocumentStatusPatch,
  deriveProfileVerificationState,
} from '@/lib/profileVerification';

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

    const updateData: Record<string, string | null> = {
      [statusField]: newStatus,
    };

    if (action === 'reject' && notes) {
      updateData[notesField] = notes;
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
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('activite_exercee, documents_submitted_at, carte_identite_url, kbis_url, rc_pro_url, carte_identite_status, kbis_status, rc_pro_status')
      .eq('id', userId)
      .single();

    if (profile) {
      const derivedState = deriveProfileVerificationState(profile);
      const normalizedStatuses = buildDocumentStatusPatch(derivedState);
      const accountStatusFields = buildAccountStatusFields(
        derivedState,
        profile.documents_submitted_at
      );

      await supabaseAdmin
        .from('profiles')
        .update({
          ...normalizedStatuses,
          ...accountStatusFields,
        })
        .eq('id', userId);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Document ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès` 
    });
  } catch (error) {
    console.error('Error in /api/admin/validate-document:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
