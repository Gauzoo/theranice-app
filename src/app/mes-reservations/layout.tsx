import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes réservations",
  description: "Consultez et gérez vos réservations de salles thérapeutiques sur Théranice.",
  alternates: { canonical: "/mes-reservations" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
