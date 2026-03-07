import Image from "next/image";
import { EB_Garamond } from "next/font/google";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Mentions légales | Théranice",
  description: "Mentions légales du site Théranice – Espaces professionnels à Nice",
};

export default function MentionsLegalesPage() {
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
            Mentions légales
          </h1>
        </div>
      </section>

      {/* Contenu */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="prose prose-slate max-w-none">

            {/* Éditeur */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373]`}>
              ▸ Éditeur du site
            </h2>
            <p className="mb-2">Le site THÉRANICE est édité par :</p>
            <p className="mb-6 pl-4 border-l-4 border-[#D4A373]/30 space-y-1">
              <strong>SCI THERA NICE</strong><br />
              19 rue Michelet<br />
              06100 Nice – France<br />
              <br />
              Société Civile Immobilière<br />
              Immatriculée au Registre du Commerce et des Sociétés de Nice<br />
              <strong>SIRET :</strong> 990 302 887<br />
              Non assujettie à la TVA<br />
              <strong>Email :</strong> (à compléter)
            </p>

            {/* Directeur de publication */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Directeur de la publication
            </h2>
            <p className="mb-6">
              SCI THERA NICE, représentée par sa gérante en exercice.
            </p>

            {/* Hébergement */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Hébergement
            </h2>
            <p className="mb-2">Le site est hébergé par :</p>
            <p className="mb-6 pl-4 border-l-4 border-[#D4A373]/30">
              <strong>Vercel</strong><br />
              1345 Avenue of the Americas<br />
              New York, NY 10105<br />
              United States<br />
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D4A373] hover:underline"
              >
                https://vercel.com
              </a>
            </p>

            {/* Propriété intellectuelle */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Propriété intellectuelle
            </h2>
            <p className="mb-6">
              L&apos;ensemble des éléments du site (textes, logo, structure, design) est protégé par le droit de la propriété intellectuelle.
              Toute reproduction totale ou partielle sans autorisation préalable écrite est interdite.
            </p>

            {/* Responsabilité */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Responsabilité
            </h2>
            <p className="mb-4">
              La SCI THERA NICE s&apos;efforce d&apos;assurer l&apos;exactitude des informations publiées.
              Elle ne saurait être tenue responsable :
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>D&apos;erreurs ou omissions</li>
              <li>D&apos;une indisponibilité temporaire du site</li>
              <li>D&apos;un usage inapproprié des informations publiées</li>
            </ul>

            <p className="text-sm text-slate-500 mt-12">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
