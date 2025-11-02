"use client";

import Image from "next/image";
import { EB_Garamond } from "next/font/google";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function ProfilPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    therapie: "",
  });

  // Récupère les données de l'utilisateur au chargement
  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Si pas connecté, redirige vers la page d'accueil
        router.push("/");
        return;
      }

      // Récupère le profil depuis la table profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFormData({
          nom: profile.nom || "",
          prenom: profile.prenom || "",
          email: user.email || "",
          telephone: profile.telephone || "",
          therapie: profile.therapie || "",
        });
      }
    };

    fetchUserData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Vous devez être connecté");
      }

      // Met à jour le profil dans la table profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          therapie: formData.therapie,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setIsEditing(false);
      
      // Cache le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Une erreur est survenue lors de la mise à jour");
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
          
          <h1 className="text-4xl sm:text-5xl">
            {formData.prenom} {formData.nom}
          </h1>

          <p className="text-lg text-slate-100">
            Gérez vos informations personnelles
          </p>
        </div>
      </section>

      {/* Section formulaire de profil */}
      <section className="bg-[#FFFFFF] py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`${garamond.className} text-4xl font-semibold text-[#D4A373]`}>▸ Mes informations</h2>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="cursor-pointer bg-[#D4A373] px-6 py-2 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363]"
              >
                Modifier
              </button>
            )}
          </div>

          {/* Messages d'erreur et de succès */}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded mb-6">
              Profil mis à jour avec succès !
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom et Prénom */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="nom" className="block text-sm font-semibold text-slate-900">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373] disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label htmlFor="prenom" className="block text-sm font-semibold text-slate-900">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373] disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="Votre prénom"
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
                value={formData.email}
                disabled
                className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 bg-slate-100 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-slate-500">L&apos;email ne peut pas être modifié</p>
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
                value={formData.telephone}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373] disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder="06 00 00 00 00"
              />
            </div>

            {/* Type de thérapie */}
            <div>
              <label htmlFor="therapie" className="block text-sm font-semibold text-slate-900">
                Type de thérapie pratiquée <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="therapie"
                name="therapie"
                value={formData.therapie}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373] disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder="Ex: Hypnothérapie, Sophrologie..."
              />
            </div>

            {/* Boutons Enregistrer et Annuler (visibles uniquement en mode édition) */}
            {isEditing && (
              <div className="flex justify-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="cursor-pointer bg-slate-300 px-8 py-3 font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:bg-slate-400"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer bg-[#D4A373] px-8 py-3 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            )}
          </form>

        </div>
      </section>
    </div>
  );
}
