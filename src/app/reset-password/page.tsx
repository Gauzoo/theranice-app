"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const clearRecoveryUrl = () => {
      window.history.replaceState({}, document.title, "/reset-password");
    };

    const initializeRecoverySession = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type") ?? hashParams.get("type");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }

          clearRecoveryUrl();
        } else if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }

          clearRecoveryUrl();
        } else if (tokenHash && type === "recovery") {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });

          if (verifyError) {
            throw verifyError;
          }

          clearRecoveryUrl();
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        setHasSession(!!session);
        if (!session) {
          setError("Lien expiré ou invalide. Veuillez demander un nouveau lien.");
        }
      } catch {
        if (!active) {
          return;
        }

        setHasSession(false);
        setError("Lien expiré ou invalide. Veuillez demander un nouveau lien.");
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    };

    void initializeRecoverySession();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      await supabase.auth.signOut();
      setSuccess(true);
      setTimeout(() => {
        router.push("/connexion");
      }, 3000);
    } catch {
      setError("Une erreur est survenue lors de la modification du mot de passe. Veuillez réessayer.");
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
          className="absolute inset-0 object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-900/40" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-4xl flex-col gap-4 px-6 py-16 text-center">
          <h1 className="text-4xl font-semibold sm:text-5xl">
            Nouveau mot de passe
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-lg px-6 py-16">
        {checking ? (
          <div className="text-center text-slate-500">Chargement...</div>
        ) : !hasSession ? (
          <div className="bg-red-50 border border-red-200 rounded p-6 text-center">
            <p className="text-red-800 font-medium">Lien expiré ou invalide</p>
            <p className="text-red-700 text-sm mt-2">
              Ce lien de réinitialisation n&apos;est plus valide. Veuillez en demander un nouveau.
            </p>
            <Link
              href="/mot-de-passe-oublie"
              className="inline-block mt-4 text-sm text-[#D4A373] hover:text-[#c49363] font-medium"
            >
              Demander un nouveau lien
            </Link>
          </div>
        ) : success ? (
          <div className="bg-green-50 border border-green-200 rounded p-6 text-center">
            <p className="text-green-800 font-medium">Mot de passe modifié !</p>
            <p className="text-green-700 text-sm mt-2">Redirection vers la connexion...</p>
          </div>
        ) : (
          <>
            <p className="text-slate-600 mb-8 text-center">
              Choisissez votre nouveau mot de passe.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-900">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-2 w-full border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-semibold text-slate-900">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  id="confirm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-2 w-full border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D4A373] text-white font-semibold py-3 cursor-pointer hover:bg-[#c49363] transition-colors uppercase tracking-wide disabled:opacity-50"
              >
                {loading ? "Modification..." : "Modifier le mot de passe"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
