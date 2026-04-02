import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réservation",
  description: "Réservez votre salle thérapeutique à Nice — Salon Athéna, Salle Gaïa ou Grande Salle. À partir de 8€/h.",
  alternates: { canonical: "/reservation" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
