"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseAuthError } from "@/lib/supabase/authErrors";
import Link from "next/link";
import Image from "next/image";

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPublicSiteOrigin = () => {
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

    if (!configuredSiteUrl) {
      return window.location.origin;
    }

    try {
      return new URL(configuredSiteUrl).origin;
    } catch {
      return window.location.origin;
    }
  };

  useEffect(() => {
    const recoveryError = new URLSearchParams(window.location.search).get("error");

    if (!recoveryError) {
      return;
    }

    setError("Lien expire ou invalide. Veuillez demander un nouveau lien de reinitialisation.");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const resetUrl = new URL("/reset-password", getPublicSiteOrigin());

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetUrl.toString(),
      });

      if (error) throw error;
      setSent(true);
    } catch (err: unknown) {
      setError(
        translateSupabaseAuthError(
          err,
          "Impossible d'envoyer l'email de reinitialisation pour cette adresse. Contactez l'administration si le probleme persiste."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900">
      {/* Hero section */}
      <section className="relative isolate flex min-h-[40vh] items-center justify-center overflow-hidden pt-24 text-white">
        <Image
          src="/photos/covers1.jpg"
          alt="Théranice"
          fill
          sizes="100vw"
          className="absolute inset-0 object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-900/40" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-4xl flex-col gap-4 px-6 py-16 text-center">
          <h1 className="text-4xl font-semibold sm:text-5xl">
            Mot de passe oublié
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-lg px-6 py-16">
        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded p-6 text-center">
            <p className="text-green-800 font-medium">Email envoyé !</p>
            <p className="text-green-700 text-sm mt-2">
              Si un compte existe avec cette adresse, vous recevrez un lien pour réinitialiser votre mot de passe.
            </p>
            <Link
              href="/connexion"
              className="inline-block mt-4 text-sm text-[#D4A373] hover:text-[#c49363] font-medium"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <p className="text-slate-600 mb-8 text-center">
              Saisissez votre adresse email pour recevoir un lien de réinitialisation.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 w-full border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                  placeholder="votre@email.fr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D4A373] text-white font-semibold py-3 cursor-pointer hover:bg-[#c49363] transition-colors uppercase tracking-wide disabled:opacity-50"
              >
                {loading ? "Envoi..." : "Envoyer le lien"}
              </button>

              <div className="text-center">
                <Link
                  href="/connexion"
                  className="text-sm text-slate-600 hover:text-[#D4A373] transition-colors"
                >
                  Retour à la connexion
                </Link>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
