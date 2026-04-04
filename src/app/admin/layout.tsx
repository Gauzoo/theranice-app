import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAdminPermission } from "@/lib/adminAuth";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkAdminPermission();

  if (!isAdmin) {
    redirect('/connexion');
  }

  return children;
}
