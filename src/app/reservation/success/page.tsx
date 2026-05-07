import type { Metadata } from "next";
import SuccessPageClient from "./SuccessPageClient";

export const metadata: Metadata = {
  title: "Réservation confirmée",
  description: "Confirmation de réservation Théranice.",
  alternates: { canonical: "/reservation/success" },
  robots: { index: false, follow: false },
};

export default function SuccessPage() {
  return <SuccessPageClient />;
}
