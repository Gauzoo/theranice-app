import Image from "next/image";
import { EB_Garamond } from "next/font/google";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Politique de confidentialité | Théranice",
  description: "Politique de confidentialité et protection des données personnelles – Théranice",
};

export default function PolitiqueConfidentialitePage() {
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
            Politique de confidentialité
          </h1>
        </div>
      </section>

      {/* Contenu */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="prose prose-slate max-w-none">

            {/* 1. Responsable du traitement */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373]`}>
              ▸ 1. Responsable du traitement
            </h2>
            <p className="mb-2">Le responsable du traitement des données est :</p>
            <p className="mb-6 pl-4 border-l-4 border-[#D4A373]/30">
              <strong>SCI THERA NICE</strong><br />
              19 rue Michelet<br />
              06100 Nice – France<br />
              Représentée par ses gérants en exercice<br />
              <br />
              <strong>Email de contact :</strong> (à compléter)
            </p>

            {/* 2. Données collectées */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 2. Données collectées
            </h2>
            <p className="mb-4">
              Dans le cadre de l&apos;utilisation de la plateforme THÉRANICE, les données suivantes peuvent être collectées :
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Données d&apos;identification</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Nom</li>
              <li>Prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Profession</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Données professionnelles</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Numéro SIRET</li>
              <li>Attestation d&apos;assurance responsabilité civile professionnelle</li>
              <li>Documents justificatifs éventuels</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Données liées à la réservation</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Dates et créneaux réservés</li>
              <li>Montant payé</li>
              <li>Historique des réservations</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Données de connexion</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Adresse IP</li>
              <li>Données de navigation</li>
              <li>Cookies techniques</li>
            </ul>

            {/* 3. Finalités du traitement */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 3. Finalités du traitement
            </h2>
            <p className="mb-4">Les données sont collectées afin de :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Créer et gérer les comptes utilisateurs</li>
              <li>Permettre la réservation des espaces</li>
              <li>Assurer la facturation</li>
              <li>Vérifier la conformité des profils</li>
              <li>Garantir la sécurité des locaux</li>
              <li>Gérer les litiges éventuels</li>
              <li>Respecter les obligations légales et comptables</li>
            </ul>

            {/* 4. Base légale */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 4. Base légale du traitement
            </h2>
            <p className="mb-4">Les traitements sont fondés sur :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>L&apos;exécution du contrat (réservation d&apos;espace)</li>
              <li>Le respect d&apos;obligations légales</li>
              <li>L&apos;intérêt légitime de l&apos;Exploitant (sécurité, prévention des abus)</li>
              <li>Le consentement (cookies non essentiels)</li>
            </ul>

            {/* 5. Destinataires */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 5. Destinataires des données
            </h2>
            <p className="mb-4">Les données sont exclusivement destinées :</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>À la SCI THERA NICE</li>
              <li>Aux prestataires techniques nécessaires au fonctionnement du site (hébergeur, solution de paiement)</li>
            </ul>
            <p className="mb-2">Le site est hébergé par <strong>Vercel</strong>.</p>
            <p className="mb-6">Les données ne sont ni vendues ni cédées à des tiers.</p>

            {/* 6. Durée de conservation */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 6. Durée de conservation
            </h2>
            <p className="mb-4">Les données sont conservées :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Pendant toute la durée de la relation contractuelle</li>
              <li>Puis archivées à des fins comptables pendant la durée légale applicable</li>
              <li>Les données de connexion sont conservées conformément aux obligations légales en vigueur</li>
            </ul>

            {/* 7. Sécurité */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 7. Sécurité des données
            </h2>
            <p className="mb-4">
              THÉRANICE met en œuvre toutes mesures techniques et organisationnelles appropriées pour assurer :
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>La confidentialité</li>
              <li>L&apos;intégrité</li>
              <li>La protection contre l&apos;accès non autorisé</li>
            </ul>

            {/* 8. Droits des utilisateurs */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 8. Droits des utilisateurs
            </h2>
            <p className="mb-4">
              Conformément au Règlement Général sur la Protection des Données (RGPD), chaque utilisateur dispose :
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>D&apos;un droit d&apos;accès</li>
              <li>D&apos;un droit de rectification</li>
              <li>D&apos;un droit d&apos;effacement</li>
              <li>D&apos;un droit d&apos;opposition</li>
              <li>D&apos;un droit à la limitation du traitement</li>
              <li>D&apos;un droit à la portabilité</li>
            </ul>
            <p className="mb-4">Toute demande peut être adressée à : <strong>(email à compléter)</strong></p>
            <p className="mb-2">Une réclamation peut être introduite auprès de :</p>
            <p className="mb-6 pl-4 border-l-4 border-[#D4A373]/30">
              <strong>Commission nationale de l&apos;informatique et des libertés (CNIL)</strong><br />
              3 Place de Fontenoy – TSA 80715<br />
              75334 Paris Cedex 07<br />
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#D4A373] hover:underline">www.cnil.fr</a>
            </p>

            {/* 9. Cookies */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 9. Cookies
            </h2>
            <p className="mb-4">Le site utilise :</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Des cookies strictement nécessaires au fonctionnement du site</li>
              <li>Éventuellement des cookies d&apos;analyse (si activés)</li>
            </ul>
            <p className="mb-6">
              Un bandeau d&apos;information permet à l&apos;utilisateur d&apos;accepter ou refuser les cookies non essentiels.
            </p>

            {/* 10. Modification */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 10. Modification de la politique
            </h2>
            <p className="mb-6">
              La présente politique peut être modifiée à tout moment.
              La version applicable est celle publiée sur le site à la date de consultation.
            </p>

            <p className="text-sm text-slate-500 mt-12">
              Dernière mise à jour : (à compléter)
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}