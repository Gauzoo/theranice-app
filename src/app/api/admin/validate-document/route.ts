import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, documentType, action, notes } = await request.json();

    if (!userId || !documentType || !action) {
      return NextResponse.json(
        { error: 'userId, documentType et action sont requis' },
        { status: 400 }
      );
    }

    if (!['carte', 'kbis'].includes(documentType)) {
      return NextResponse.json(
        { error: 'documentType doit être "carte" ou "kbis"' },
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

    const statusField = documentType === 'carte' ? 'carte_identite_status' : 'kbis_status';
    const notesField = documentType === 'carte' ? 'carte_identite_rejection_notes' : 'kbis_rejection_notes';
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

    // Vérifier si les deux documents sont approuvés pour mettre à jour account_status
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('carte_identite_status, kbis_status')
      .eq('id', userId)
      .single();

    if (profile) {
      const bothApproved = profile.carte_identite_status === 'approved' && profile.kbis_status === 'approved';
      const anyRejected = profile.carte_identite_status === 'rejected' || profile.kbis_status === 'rejected';

      let accountStatus = 'documents_submitted';
      if (bothApproved) {
        accountStatus = 'approved';
      } else if (anyRejected) {
        accountStatus = 'rejected';
      }

      await supabaseAdmin
        .from('profiles')
        .update({ 
          account_status: accountStatus,
          validated_at: bothApproved ? new Date().toISOString() : null
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
