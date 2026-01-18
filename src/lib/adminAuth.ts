import { createClient } from "@/lib/supabase/server";

// Liste des emails administrateurs
const ADMIN_EMAILS = ['gauthier.guerin@gmail.com'];

export async function checkAdminPermission() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return false;
  }

  return ADMIN_EMAILS.includes(user.email);
}
