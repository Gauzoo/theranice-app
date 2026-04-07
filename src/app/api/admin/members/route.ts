import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { checkAdminPermission } from '@/lib/adminAuth';

const PROFILES_SELECT_FULL =
  'id, nom, prenom, telephone, created_at, account_status, activite_exercee, adresse, siret, carte_identite_url, kbis_url, rc_pro_url, carte_identite_status, kbis_status, rc_pro_status, carte_identite_rejection_notes, kbis_rejection_notes, rc_pro_rejection_notes, documents_submitted_at, validation_notes';

const PROFILES_SELECT_REDUCED =
  'id, nom, prenom, telephone, created_at, account_status, activite_exercee, adresse, siret, carte_identite_url, kbis_url, rc_pro_url, carte_identite_status, kbis_status, rc_pro_status';

const PROFILES_SELECT_MINIMAL =
  'id, nom, prenom, telephone, created_at, account_status, activite_exercee, adresse, siret';

const PROFILE_SELECT_FALLBACKS = [
  PROFILES_SELECT_FULL,
  PROFILES_SELECT_REDUCED,
  PROFILES_SELECT_MINIMAL,
] as const;

const createSupabaseAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      client: null,
      error: 'Configuration Supabase serveur incomplète',
    };
  }

  return {
    client: createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
    error: null,
  };
};

const fetchMembersWithSchemaFallback = async (
  supabaseAdmin: any
) => {
  let lastError: { code?: string; message?: string; details?: string; hint?: string } | null = null;

  for (const [index, selectClause] of PROFILE_SELECT_FALLBACKS.entries()) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(selectClause)
      .order('created_at', { ascending: false });

    if (!error) {
      if (index > 0) {
        console.warn('[admin/members] fallback select applied', {
          fallbackIndex: index,
          selectClause,
        });
      }

      return { members: data || [], error: null };
    }

    lastError = {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    };

    console.warn('[admin/members] select failed, trying fallback', {
      fallbackIndex: index,
      error: lastError,
    });
  }

  return { members: null, error: lastError };
};

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
    const { client: supabaseAdmin, error: clientError } = createSupabaseAdminClient();
    if (!supabaseAdmin) {
      console.error('[admin/members] missing server configuration', { clientError });
      return NextResponse.json(
        { error: clientError || 'Configuration serveur invalide' },
        { status: 503 }
      );
    }

    const { members, error } = await fetchMembersWithSchemaFallback(supabaseAdmin);

    if (error || !members) {
      console.error('[admin/members] failed to fetch profiles', { error });
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des membres' },
        { status: 500 }
      );
    }

    // Récupère les emails depuis auth.users (non bloquant)
    const emailMap = new Map<string, string>();
    try {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        console.warn('[admin/members] auth.users email enrichment unavailable', {
          code: authError.code,
          message: authError.message,
        });
      } else {
        for (const user of authUsers.users) {
          if (user.email) {
            emailMap.set(user.id, user.email);
          }
        }
      }
    } catch (authError) {
      console.warn('[admin/members] auth.users email enrichment threw', {
        authError,
      });
    }

    // Ajoute l'email à chaque membre
    const membersWithEmail = (members as Array<Record<string, unknown>>).map((member) => ({
      ...member,
      email:
        typeof member.id === 'string'
          ? emailMap.get(member.id) || ''
          : '',
    }));

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

    const { client: supabaseAdmin, error: clientError } = createSupabaseAdminClient();
    if (!supabaseAdmin) {
      console.error('[admin/members PATCH] missing server configuration', { clientError });
      return NextResponse.json(
        { error: clientError || 'Configuration serveur invalide' },
        { status: 503 }
      );
    }

    const updatePayload = {
      nom,
      prenom,
      telephone,
      activite_exercee: activiteExercee,
      adresse,
      siret: siret ? siret.replace(/\s+/g, '') : null,
    };

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', memberId);

    if (updateError) {
      console.error('Error updating member profile:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du membre' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
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
    const { client: supabaseAdmin, error: clientError } = createSupabaseAdminClient();
    if (!supabaseAdmin) {
      console.error('[admin/members DELETE] missing server configuration', { clientError });
      return NextResponse.json(
        { error: clientError || 'Configuration serveur invalide' },
        { status: 503 }
      );
    }

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
