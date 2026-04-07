import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { checkAdminPermission } from '@/lib/adminAuth';

export async function GET() {
  try {
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json(
        { error: 'Config serveur manquante', debug: { hasUrl: !!url, hasKey: !!key } },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: members, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json(
        {
          error: 'Erreur lors de la récupération des membres',
          debug: { code: error.code, message: error.message, details: error.details, hint: error.hint },
        },
        { status: 500 }
      );
    }

    // Récupère les emails depuis auth.users (non bloquant)
    let emailMap = new Map<string, string>();
    try {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      if (authUsers?.users) {
        for (const user of authUsers.users) {
          if (user.email) emailMap.set(user.id, user.email);
        }
      }
    } catch (e) {
      console.warn('Could not fetch auth users for email enrichment:', e);
    }

    const membersWithEmail = (members || []).map((member: Record<string, unknown>) => ({
      ...member,
      email: typeof member.id === 'string' ? emailMap.get(member.id) || '' : '',
    }));

    return NextResponse.json({ members: membersWithEmail });
  } catch (error) {
    console.error('Error in GET /api/admin/members:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', debug: { message: error instanceof Error ? error.message : String(error) } },
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

    const { memberId, nom, prenom, telephone, activite_exercee, adresse, siret } = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: 'memberId est requis' }, { status: 400 });
    }
    if (!nom?.trim() || !prenom?.trim()) {
      return NextResponse.json({ error: 'Nom et prénom sont requis' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone?.trim() || null,
        activite_exercee: activite_exercee?.trim() || null,
        adresse: adresse?.trim() || null,
        siret: siret?.trim()?.replace(/\s+/g, '') || null,
      })
      .eq('id', memberId);

    if (updateError) {
      console.error('Error updating member:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour du membre' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/admin/members:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: 'ID du membre manquant' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
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

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', memberId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      return NextResponse.json({ error: 'Erreur lors de la suppression du profil' }, { status: 500 });
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(memberId);
    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json({ error: 'Erreur lors de la suppression de l\'utilisateur' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/members:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
