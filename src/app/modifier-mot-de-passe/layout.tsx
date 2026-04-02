import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modifier le mot de passe",
  description: "Modifiez votre mot de passe Théranice.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/modifier-mot-de-passe" },
};

export default function ModifierMotDePasseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
