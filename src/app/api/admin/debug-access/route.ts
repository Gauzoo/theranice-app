import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const rawEnv = process.env.ADMIN_EMAILS || '(not set — fallback used)';
  const adminEmails = (process.env.ADMIN_EMAILS || 'gauthier.guerin@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = user?.email?.toLowerCase() || null;
  const isAdmin = userEmail ? adminEmails.includes(userEmail) : false;

  return NextResponse.json({
    userEmail,
    isAdmin,
    adminEmailsConfigured: adminEmails,
    rawEnvValue: rawEnv,
  });
}
