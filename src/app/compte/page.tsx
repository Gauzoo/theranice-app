"use client";

import Image from "next/image";
import { EB_Garamond } from "next/font/google";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function ComptePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;
    const nom = formData.get("nom") as string;
    const prenom = formData.get("prenom") as string;
    const telephone = formData.get("telephone") as string;
    const activite_exercee = formData.get("activite_exercee") as string;

    // Vérification que les mots de passe correspondent
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    // Vérification de la longueur du mot de passe
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Créer le compte utilisateur
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nom,
            prenom,
            telephone,
            activite_exercee,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // Vérifier si l'utilisateur existe déjà (Supabase retourne un user mais avec identities vide)
      if (data.user && !data.user.identities?.length) {
        setError("Un compte existe déjà avec cet email. Veuillez vous connecter.");
        setLoading(false);
        return;
      }

      if (data.user) {
        setSuccess(true);
        // Rediriger vers la page d'accueil après 2 secondes
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Une erreur est survenue lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900">
      {/* Hero section - réduite de moitié */}
      <section
        className="relative isolate flex min-h-[40vh] items-center justify-center overflow-hidden pt-24 text-white"
      >
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
            Créer votre compte
          </h1>
          <p className="text-lg text-slate-100">
            Réservez vos créneaux en quelques clics
          </p>
        </div>
      </section>

      {/* Section formulaire d'inscription */}
      <section className="bg-[#FFFFFF] py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className={`${garamond.className} text-4xl font-semibold mb-8 text-[#D4A373]`}>▸ Inscription</h2>

          {/* Messages d'erreur et de succès */}
          {error && (
            <div className="bg-[#B12F2E] border border-[#B12F2E] text-white px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-[#56862F] border border-[#56862F] text-white px-4 py-3 rounded mb-6">
              Compte créé avec succès ! Vérifiez votre email pour confirmer votre inscription.
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom et Prénom */}
            <div className="grid gap-6 md:grid-cols-2">


              <div>
                <label htmlFor="prenom" className="block text-sm font-semibold text-slate-900">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  required
                  className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label htmlFor="nom" className="block text-sm font-semibold text-slate-900">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  required
                  className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                  placeholder="Votre nom"
                />
              </div>

            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                placeholder="votre@email.fr"
              />
            </div>

            {/* Téléphone */}
            <div>
              <label htmlFor="telephone" className="block text-sm font-semibold text-slate-900">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                required
                className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                placeholder="06 00 00 00 00"
              />
            </div>

            {/* Activité exercée */}
            <div>
              <label htmlFor="activite_exercee" className="block text-sm font-semibold text-slate-900">
                Activité exercée <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="activite_exercee"
                name="activite_exercee"
                required
                className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                placeholder="Ex: Hypnothérapie, Sophrologie..."
              />
            </div>

            {/* Mot de passe */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-900">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-semibold text-slate-900">
                  Confirmer mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  required
                  className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Bouton Créer mon compte */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer bg-[#D4A373] px-8 py-3 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Création en cours..." : "Créer mon compte"}
              </button>
            </div>
          </form>

        </div>
      </section>
    </div>
  );
}
