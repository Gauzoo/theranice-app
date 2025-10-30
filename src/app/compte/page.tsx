import Image from "next/image";
import { EB_Garamond } from "next/font/google";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function ComptePage() {
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


          
          <form className="space-y-6">
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
                  required
                  className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
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
                  required
                  className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
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

            {/* Type de thérapie */}
            <div>
              <label htmlFor="therapie" className="block text-sm font-semibold text-slate-900">
                Type de thérapie pratiquée <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="therapie"
                name="therapie"
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
                className="cursor-pointer bg-[#D4A373] px-8 py-3 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363]"
              >
                Créer mon compte
              </button>
            </div>
          </form>

        </div>
      </section>
    </div>
  );
}
