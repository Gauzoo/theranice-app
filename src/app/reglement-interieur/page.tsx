import Image from "next/image";
import { EB_Garamond } from "next/font/google";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Règlement Intérieur | Théranice",
  description: "Règlement intérieur des espaces professionnels Théranice",
};

export default function ReglementInterieurPage() {
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
            Règlement Intérieur
          </h1>
        </div>
      </section>

      {/* Contenu */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="prose prose-slate max-w-none">

            <p className="text-lg font-semibold mb-2">THÉRANICE</p>
            <p className="mb-8 text-slate-600">
              Exploité par SCI THERA NICE<br />
              19 rue Michelet – 06100 Nice
            </p>

            {/* Article 1 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373]`}>
              ▸ Article 1 – Destination des lieux
            </h2>
            <p className="mb-4">
              Les espaces THÉRANICE sont exclusivement dédiés aux activités de consultation et d&apos;accompagnement non invasif.
            </p>
            <p className="mb-6">
              Toute activité incompatible avec un environnement professionnel calme et confidentiel est interdite.
            </p>

            {/* Article 2 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 2 – Description des espaces
            </h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">Salle 1</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Deux fauteuils de consultation</li>
              <li>Un bureau</li>
              <li>Des chaises</li>
              <li>Un plaid</li>
              <li>Accès à un ampli Bluetooth</li>
              <li>Table de massage sur demande</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Salle 2</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Un bureau</li>
              <li>Des chaises</li>
              <li>Un tabouret roulant</li>
              <li>Un plaid</li>
              <li>Un lave-mains</li>
              <li>Essuie-mains</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Grande salle</h3>
            <p className="mb-6">
              Possibilité d&apos;ouverture de la porte coulissante permettant l&apos;utilisation conjointe des deux espaces selon réservation.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Espaces communs</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Salle d&apos;attente</li>
              <li>Cuisine (café, tisane)</li>
              <li>Sanitaires accessibles PMR</li>
            </ul>

            {/* Article 3 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 3 – Respect des lieux
            </h2>
            <p className="mb-4">L&apos;Utilisateur s&apos;engage à :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Utiliser les équipements conformément à leur destination</li>
              <li>Ne pas modifier l&apos;agencement des salles</li>
              <li>Remettre le mobilier à sa place</li>
              <li>Restituer les lieux propres et rangés</li>
            </ul>

            {/* Article 4 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 4 – Propreté
            </h2>
            <p className="mb-4">
              Les espaces doivent être laissés en parfait état.
            </p>
            <p className="mb-6">
              En cas de manquement manifeste, des frais de remise en état pourront être facturés.
            </p>

            {/* Article 5 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 5 – Nuisances
            </h2>
            <p className="mb-4">
              Le calme et la confidentialité doivent être respectés.
            </p>
            <p className="mb-6">
              L&apos;utilisation de l&apos;ampli Bluetooth doit rester à un volume modéré.
            </p>

            {/* Article 6 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 6 – Horaires
            </h2>
            <p className="mb-4">
              Les créneaux incluent installation et rangement.
            </p>
            <p className="mb-6">
              Tout dépassement pourra faire l&apos;objet d&apos;une facturation complémentaire.
            </p>

            {/* Article 7 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 7 – Responsabilité
            </h2>
            <p className="mb-4">
              L&apos;Utilisateur est seul responsable des dommages causés durant sa réservation.
            </p>
            <p className="mb-6">
              Il s&apos;engage à indemniser toute dégradation constatée.
            </p>

            {/* Article 8 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 8 – Assurance
            </h2>
            <p className="mb-6">
              L&apos;Utilisateur certifie être titulaire d&apos;une assurance Responsabilité Civile Professionnelle valide.
            </p>

            {/* Article 9 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 9 – Sanctions
            </h2>
            <p className="mb-4">
              Tout manquement pourra entraîner :
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Suspension du compte</li>
              <li>Refus de futures réservations</li>
              <li>Facturation des dommages</li>
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
