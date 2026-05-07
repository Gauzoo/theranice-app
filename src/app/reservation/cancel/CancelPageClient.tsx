"use client";

import Image from "next/image";
import Link from "next/link";
import { EB_Garamond } from "next/font/google";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function CancelPageClient() {
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
            Paiement annulé
          </h1>
        </div>
      </section>

      <section className="bg-[#FFFFFF] py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="bg-white p-8 text-center shadow-lg">
            <div className="mb-6 text-6xl">❌</div>
            <h2 className={`${garamond.className} mb-4 text-3xl font-semibold text-slate-900`}>
              Paiement annulé
            </h2>
            <p className="mb-6 text-lg text-slate-600">
              Vous avez annulé le processus de paiement.
            </p>
            <div className="mb-6 border-l-4 border-slate-400 bg-slate-100 p-6">
              <p className="text-slate-700">
                <strong>ℹ️ Aucune réservation n&apos;a été créée</strong><br />
                Votre créneau reste disponible. Vous pouvez relancer une réservation quand vous le souhaitez.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/reservation"
                className="bg-[#D4A373] px-8 py-3 font-medium text-white transition-colors hover:bg-[#c39363]"
              >
                Réessayer
              </Link>
              <Link
                href="/"
                className="border-2 border-slate-300 bg-white px-8 py-3 font-medium text-slate-900 transition-colors hover:bg-slate-50"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}