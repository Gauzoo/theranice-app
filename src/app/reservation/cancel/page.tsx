import type { Metadata } from "next";
import CancelPageClient from "./CancelPageClient";

export const metadata: Metadata = {
  title: "Paiement annulé",
  description: "Annulation du paiement de réservation Théranice.",
  alternates: { canonical: "/reservation/cancel" },
  robots: { index: false, follow: false },
};

export default function CancelPage() {
  return <CancelPageClient />;
}
