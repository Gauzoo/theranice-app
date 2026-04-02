import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  description: "Définissez votre nouveau mot de passe Théranice.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
