"use client";

import Image from "next/image";
import { EB_Garamond } from "next/font/google";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function ConnexionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Email ou mot de passe incorrect");
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
            Connexion
          </h1>
          <p className="text-lg text-slate-100">
            Accédez à votre espace personnel
          </p>
        </div>
      </section>

      {/* Section formulaire de connexion */}
      <section className="bg-[#FFFFFF] py-16">
        <div className="mx-auto max-w-md px-6">
          <h2 className={`${garamond.className} text-4xl font-semibold mb-8 text-[#D4A373] text-center`}>▸ Mon Compte</h2>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                placeholder="e-mail *"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                placeholder="Mot de passe *"
              />
            </div>

            {/* Bouton Connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4A373] text-white font-semibold py-3 cursor-pointer hover:bg-[#c49363] transition-colors uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion..." : "Connexion"}
            </button>

            {/* Bouton Créer un compte */}
            <Link
              href="/compte"
              className="block w-full text-center border-2 border-[#D4A373] text-[#D4A373] font-semibold py-3 hover:bg-[#D4A373] hover:text-white transition-colors uppercase tracking-wide"
            >
              Créer un compte
            </Link>

            {/* Mot de passe oublié */}
            <div className="text-center pt-2">
              <a
                href="#"
                className="text-sm text-slate-600 hover:text-[#D4A373] transition-colors"
              >
                Mot de passe oublié ?
              </a>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
