import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { checkAdminPermission } from '@/lib/adminAuth';

export async function GET() {
  try {
    // Vérification de sécurité CRITIQUE
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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

    // Récupère tous les membres avec les champs de validation
    const { data: members, error } = await supabaseAdmin
      .from('profiles')
      .select('id, nom, prenom, telephone, created_at, account_status, activite_exercee, carte_identite_url, kbis_url, carte_identite_status, kbis_status, carte_identite_rejection_notes, kbis_rejection_notes, documents_submitted_at, validation_notes')
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

export async function DELETE(request: Request) {
  try {
    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'ID du membre manquant' },
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
