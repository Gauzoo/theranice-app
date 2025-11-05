import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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

    // Récupère tous les membres
    const { data: members, error } = await supabaseAdmin
      .from('profiles')
      .select('id, nom, prenom, telephone, created_at')
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
