import { createClient } from "@/lib/supabase/server";

// Liste des emails administrateurs (configurable via variable d'environnement)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'gauthier.guerin@gmail.com')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

export async function checkAdminPermission() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return false;
  }

  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}
