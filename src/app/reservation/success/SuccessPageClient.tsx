"use client";

import Image from "next/image";
import Link from "next/link";
import { EB_Garamond } from "next/font/google";
import { Suspense, useEffect, useState } from "react";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

function SuccessContent() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="relative isolate flex min-h-[40vh] items-center justify-center overflow-hidden pt-24 text-white">
        <Image
          src="/photos/covers1.jpg"
          alt="Theranice"
          fill
          className="absolute inset-0 object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-900/40" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-4xl flex-col gap-4 px-6 py-16 text-center">
          <h1 className="text-4xl font-semibold sm:text-5xl">
            Paiement réussi
          </h1>
        </div>
      </section>

      <section className="bg-[#FFFFFF] py-16">
        <div className="mx-auto max-w-4xl px-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#D4A373] border-t-transparent"></div>
              <p className="mt-4 text-slate-600">Confirmation en cours...</p>
            </div>
          ) : (
            <div className="bg-white p-8 text-center shadow-lg">
              <h2 className={`${garamond.className} mb-4 text-3xl font-semibold text-[#D4A373]`}>
                Réservation confirmée !
              </h2>
              <p className="mb-6 text-lg text-slate-600">
                Votre paiement a été effectué avec succès.
              </p>
              <div className="mb-6 border-l-4 border-[#D4A373] bg-[#FEFAE0] p-6">
                <p className="text-slate-700">
                  <strong>Email de confirmation envoyé</strong><br />
                  Vous allez recevoir un email avec les détails de votre réservation et votre code d&apos;accès. Votre facture sera envoyée automatiquement après votre créneau.
                </p>
              </div>

              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/mes-reservations"
                  className="bg-[#D4A373] px-8 py-3 font-medium text-white transition-colors hover:bg-[#c39363]"
                >
                  Voir ma réservation
                </Link>
                <Link
                  href="/"
                  className="border-2 border-slate-300 bg-white px-8 py-3 font-medium text-slate-900 transition-colors hover:bg-slate-50"
                >
                  Retour à l&apos;accueil
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function SuccessPageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#D4A373] border-t-transparent"></div>
            <p className="mt-4 text-slate-600">Chargement...</p>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}