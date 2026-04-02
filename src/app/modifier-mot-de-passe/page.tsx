"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

export default function ModifierMotDePasse() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Vérifier le mot de passe actuel
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });
      if (signInError) {
        setError("Mot de passe actuel incorrect");
        setLoading(false);
        return;
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/profil");
      }, 3000);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    router.push("/connexion");
    return null;
  }

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
            Modifier le mot de passe
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-lg px-6 py-16">
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded p-6 text-center">
            <p className="text-green-800 font-medium">Mot de passe modifié avec succès !</p>
            <p className="text-green-700 text-sm mt-2">
              Redirection vers votre profil...
            </p>
          </div>
        ) : (
          <>
            <p className="text-slate-600 mb-8 text-center">
              Saisissez votre mot de passe actuel puis choisissez un nouveau mot de passe.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="currentPassword" className="block text-sm font-semibold text-slate-900">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="mt-2 w-full border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-900">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-2 w-full border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                  placeholder="••••••••"
                />
                <p className="text-xs text-slate-500 mt-1">Minimum 6 caractères</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-900">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
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

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push("/profil")}
                  className="text-sm text-slate-600 hover:text-[#D4A373] transition-colors cursor-pointer"
                >
                  Retour au profil
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
