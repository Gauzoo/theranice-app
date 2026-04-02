import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon profil",
  description: "Gérez vos informations personnelles et vos documents sur Théranice.",
  alternates: { canonical: "/profil" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
