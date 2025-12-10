import Image from "next/image";
import { EB_Garamond } from "next/font/google";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Mentions légales | Theranice",
  description: "Mentions légales du site Theranice - Location de salles thérapeutiques à Nice",
};

export default function MentionsLegalesPage() {
  return (
    <div className="bg-slate-50 text-slate-900">
      {/* Hero section */}
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
            Mentions légales
          </h1>
        </div>
      </section>

      {/* Contenu */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="prose prose-slate max-w-none">
            
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373]`}>
              ▸ Éditeur du site
            </h2>
            <p className="mb-6">
              <strong>Raison sociale :</strong> Theranice<br />
              <strong>Forme juridique :</strong> [À compléter - Ex: SARL, SAS, Auto-entrepreneur]<br />
              <strong>Capital social :</strong> [À compléter]<br />
              <strong>Siège social :</strong> [Adresse complète à Nice]<br />
              <strong>SIRET :</strong> [Numéro SIRET à compléter]<br />
              <strong>APE/NAF :</strong> [Code APE à compléter]<br />
              <strong>Email :</strong> <a href="mailto:contact@theranice.fr" className="text-[#D4A373] hover:underline">contact@theranice.fr</a><br />
              <strong>Téléphone :</strong> [Numéro à compléter]<br />
              <strong>Responsable de publication :</strong> [Nom du responsable légal]
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Hébergement
            </h2>
            <p className="mb-6">
              <strong>Hébergeur :</strong> Vercel Inc.<br />
              <strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis<br />
              <strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#D4A373] hover:underline">https://vercel.com</a>
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Propriété intellectuelle
            </h2>
            <p className="mb-6">
              L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. 
              Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
            </p>
            <p className="mb-6">
              La reproduction de tout ou partie de ce site sur un support électronique ou papier quel qu'il soit est formellement interdite 
              sauf autorisation expresse du directeur de la publication.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Protection des données personnelles
            </h2>
            <p className="mb-6">
              Conformément à la loi "Informatique et Libertés" du 6 janvier 1978 modifiée et au Règlement Général sur la Protection des Données (RGPD), 
              vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles vous concernant.
            </p>
            <p className="mb-6">
              Pour exercer ces droits, vous pouvez nous contacter à l'adresse email suivante : 
              <a href="mailto:contact@theranice.fr" className="text-[#D4A373] hover:underline"> contact@theranice.fr</a>
            </p>
            <p className="mb-6">
              Pour plus d'informations sur la gestion de vos données personnelles, consultez notre 
              <a href="/politique-confidentialite" className="text-[#D4A373] hover:underline"> Politique de confidentialité</a>.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Cookies
            </h2>
            <p className="mb-6">
              Ce site utilise des cookies techniques nécessaires à son bon fonctionnement. Ces cookies ne collectent aucune donnée personnelle 
              et ne nécessitent pas de consentement préalable. Aucun cookie de tracking ou publicitaire n'est utilisé.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Limitation de responsabilité
            </h2>
            <p className="mb-6">
              Theranice s'efforce d'assurer au mieux de ses possibilités, l'exactitude et la mise à jour des informations diffusées sur ce site. 
              Toutefois, Theranice ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur ce site.
            </p>
            <p className="mb-6">
              En conséquence, Theranice décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations 
              disponibles sur ce site.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Droit applicable
            </h2>
            <p className="mb-6">
              Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.
            </p>

            <p className="text-sm text-slate-500 mt-12">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
