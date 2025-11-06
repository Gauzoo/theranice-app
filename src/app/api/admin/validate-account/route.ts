import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, action, notes } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId et action sont requis' },
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

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const updateData: Record<string, string | null> = {
      account_status: newStatus,
      validated_at: new Date().toISOString(),
    };

    if (notes) {
      updateData.validation_notes = notes;
    }

    // Met à jour le statut du compte
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating account status:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du statut' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Compte ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès` 
    });
  } catch (error) {
    console.error('Error in /api/admin/validate-account:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
