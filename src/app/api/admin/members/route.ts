import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { checkAdminPermission } from '@/lib/adminAuth';

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

const sanitizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function GET() {
  try {
    // Vérification de sécurité CRITIQUE
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Utilise la service_role_key pour bypasser RLS
    const supabaseAdmin = createSupabaseAdminClient();

    // Récupère tous les membres avec les champs de validation
    const { data: members, error } = await supabaseAdmin
      .from('profiles')
      .select('id, nom, prenom, telephone, created_at, account_status, activite_exercee, adresse, siret, carte_identite_url, kbis_url, rc_pro_url, carte_identite_status, kbis_status, rc_pro_status, carte_identite_rejection_notes, kbis_rejection_notes, rc_pro_rejection_notes, documents_submitted_at, validation_notes')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des membres' },
        { status: 500 }
      );
    }

    // Récupère les emails depuis auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des emails' },
        { status: 500 }
      );
    }

    // Crée un map des emails par user_id
    const emailMap = new Map(authUsers.users.map(u => [u.id, u.email]));

    // Ajoute l'email à chaque membre
    const membersWithEmail = members?.map(member => ({
      ...member,
      email: emailMap.get(member.id) || ''
    })) || [];

    return NextResponse.json({ members: membersWithEmail });
  } catch (error) {
    console.error('Error in /api/admin/members:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const payload = await request.json();
    const memberId = typeof payload?.memberId === 'string' ? payload.memberId : '';

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId est requis' },
        { status: 400 }
      );
    }

    const nom = sanitizeOptionalString(payload?.nom);
    const prenom = sanitizeOptionalString(payload?.prenom);
    const telephone = sanitizeOptionalString(payload?.telephone);
    const activiteExercee = sanitizeOptionalString(payload?.activite_exercee);
    const adresse = sanitizeOptionalString(payload?.adresse);
    const siret = sanitizeOptionalString(payload?.siret);

    if (!nom || !prenom) {
      return NextResponse.json(
        { error: 'Nom et prénom sont requis' },
        { status: 400 }
      );
    }

    if (nom.length > 80 || prenom.length > 80) {
      return NextResponse.json(
        { error: 'Nom ou prénom trop long' },
        { status: 400 }
      );
    }

    if (telephone && telephone.length > 30) {
      return NextResponse.json(
        { error: 'Téléphone invalide' },
        { status: 400 }
      );
    }

    if (siret && !/^\d{14}$/.test(siret.replace(/\s+/g, ''))) {
      return NextResponse.json(
        { error: 'Le SIRET doit contenir 14 chiffres (espaces autorisés)' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const updatePayload = {
      nom,
      prenom,
      telephone,
      activite_exercee: activiteExercee,
      adresse,
      siret: siret ? siret.replace(/\s+/g, '') : null,
    };

    const { data: updatedMember, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', memberId)
      .select('id, nom, prenom, telephone, created_at, account_status, activite_exercee, adresse, siret, carte_identite_url, kbis_url, rc_pro_url, carte_identite_status, kbis_status, rc_pro_status, carte_identite_rejection_notes, kbis_rejection_notes, rc_pro_rejection_notes, documents_submitted_at, validation_notes')
      .single();

    if (updateError) {
      console.error('Error updating member profile:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du membre' },
        { status: 500 }
      );
    }

    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users after patch:', authError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des emails' },
        { status: 500 }
      );
    }

    const emailMap = new Map(authUsers.users.map(u => [u.id, u.email]));

    return NextResponse.json({
      success: true,
      member: {
        ...updatedMember,
        email: emailMap.get(updatedMember.id) || '',
      },
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/members:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Vérification de sécurité CRITIQUE
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'ID du membre manquant' },
        { status: 400 }
      );
    }

    // Utilise la service_role_key pour bypasser RLS
    const supabaseAdmin = createSupabaseAdminClient();

    // Vérifier si le membre a des réservations
    const { data: memberBookings } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('user_id', memberId);

    if (memberBookings && memberBookings.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer ce membre car il a des réservations associées.' },
        { status: 400 }
      );
    }

    // Supprimer le profil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', memberId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du profil' },
        { status: 500 }
      );
    }

    // Supprimer l'utilisateur de auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(memberId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de l\'utilisateur' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/members:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
