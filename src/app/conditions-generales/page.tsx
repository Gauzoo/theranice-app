import Image from "next/image";
import { EB_Garamond } from "next/font/google";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Conditions Générales de Mise à Disposition | Théranice",
  description: "Conditions générales de mise à disposition des espaces professionnels Théranice",
};

export default function ConditionsGeneralesPage() {
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
            Conditions Générales de Mise à Disposition
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
              ▸ Article 1 – Identification de l&apos;exploitant
            </h2>
            <p className="mb-6">
              Les espaces professionnels commercialisés sous le nom THÉRANICE sont exploités par :
            </p>
            <p className="mb-6 pl-4 border-l-4 border-[#D4A373]/30">
              <strong>SCI THERA NICE</strong><br />
              19 rue Michelet<br />
              06100 Nice – France
            </p>
            <p className="mb-6">
              Ci-après dénommée « l&apos;Exploitant ».
            </p>

            {/* Article 2 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 2 – Objet
            </h2>
            <p className="mb-6">
              Les présentes Conditions Générales de Mise à Disposition (CGMD) ont pour objet de définir les modalités
              de réservation et d&apos;utilisation ponctuelle des espaces professionnels équipés situés au 19 rue Michelet – 06100 Nice.
            </p>
            <p className="mb-6">
              Toute réservation implique l&apos;acceptation pleine et entière des présentes conditions ainsi que du Règlement Intérieur.
            </p>

            {/* Article 3 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 3 – Nature juridique
            </h2>
            <p className="mb-4">
              La réservation donne lieu à une mise à disposition ponctuelle et précaire d&apos;un espace professionnel équipé.
            </p>
            <p className="mb-4">Elle ne constitue en aucun cas :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Un bail commercial</li>
              <li>Un bail professionnel</li>
              <li>Un bail d&apos;habitation</li>
              <li>Un droit au maintien dans les lieux</li>
            </ul>
            <p className="mb-6">
              Aucun droit au renouvellement ou à l&apos;occupation permanente ne pourra être revendiqué.
            </p>

            {/* Article 4 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 4 – Conditions d&apos;accès
            </h2>
            <p className="mb-4">
              La mise à disposition est exclusivement réservée aux professionnels exerçant une activité de consultation,
              d&apos;accompagnement ou de thérapie non invasive.
            </p>
            <p className="mb-4">Le professionnel doit :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Disposer d&apos;un numéro SIRET valide</li>
              <li>Être titulaire d&apos;une assurance Responsabilité Civile Professionnelle en cours de validité</li>
              <li>Avoir transmis les justificatifs requis</li>
            </ul>
            <p className="mb-4">
              L&apos;Exploitant se réserve le droit discrétionnaire d&apos;accepter ou de refuser toute demande de réservation
              ou d&apos;inscription sans obligation de motivation, dès lors que l&apos;activité déclarée n&apos;est pas compatible
              avec la destination des lieux.
            </p>
            <p className="mb-4">Sont notamment exclues :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Activités de tatouage</li>
              <li>Actes esthétiques invasifs</li>
              <li>Activités médicales nécessitant un équipement technique lourd</li>
              <li>Toute activité générant nuisances ou risques spécifiques</li>
            </ul>

            {/* Article 5 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 5 – Description des espaces
            </h2>
            <p className="mb-4">Les espaces comprennent :</p>

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
              Possibilité d&apos;ouverture de la porte coulissante entre les deux salles selon réservation.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Espaces communs</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Salle d&apos;attente</li>
              <li>Cuisine (café, tisane)</li>
              <li>Sanitaires accessibles PMR</li>
            </ul>

            {/* Article 6 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 6 – Réservation et paiement
            </h2>
            <p className="mb-4">
              Le paiement est exigible en totalité lors de la réservation.
            </p>
            <p className="mb-4">
              THÉRANICE est exploité par une SCI non assujettie à la TVA.
            </p>
            <p className="mb-6">
              Une facture sera émise après règlement.
            </p>

            {/* Article 7 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 7 – Politique d&apos;annulation
            </h2>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Annulation effectuée plus de 14 jours avant la date réservée :</strong> remboursement intégral.</li>
              <li><strong>Annulation effectuée à 14 jours ou moins :</strong> aucun remboursement.</li>
            </ul>
            <p className="mb-6">
              Toute demande d&apos;annulation doit être adressée par écrit.
            </p>

            {/* Article 8 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 8 – Responsabilité et dégradations
            </h2>
            <p className="mb-4">
              Le professionnel utilisateur est responsable de toute dégradation, détérioration ou disparition de matériel
              survenant durant sa période d&apos;occupation.
            </p>
            <p className="mb-4">Il s&apos;engage à :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Disposer d&apos;une assurance responsabilité civile professionnelle en cours de validité</li>
              <li>Déclarer immédiatement tout dommage</li>
              <li>Indemniser l&apos;Exploitant à hauteur du préjudice constaté</li>
            </ul>
            <p className="mb-4">En cas de dégradation constatée, l&apos;Exploitant pourra :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Émettre une facture correspondant au montant de la réparation ou du remplacement</li>
              <li>Suspendre ou refuser toute réservation future</li>
            </ul>
            <p className="mb-4">
              Le règlement devra intervenir dans un délai de 8 jours à compter de l&apos;émission de la facture.
            </p>
            <p className="mb-6">
              À défaut de paiement, l&apos;Exploitant pourra engager toute procédure de recouvrement et suspendre l&apos;accès à la plateforme.
            </p>

            {/* Article 9 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 9 – Assurance
            </h2>
            <p className="mb-6">
              Le professionnel déclare être titulaire d&apos;une assurance Responsabilité Civile Professionnelle couvrant son activité
              pendant toute la durée d&apos;utilisation des locaux.
            </p>

            {/* Article 10 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 10 – Indépendance
            </h2>
            <p className="mb-4">
              Le professionnel exerce son activité en totale indépendance juridique, fiscale et sociale.
            </p>
            <p className="mb-6">
              L&apos;Exploitant n&apos;intervient pas dans la relation entre le professionnel et ses patients.
            </p>

            {/* Article 11 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 11 – Données personnelles
            </h2>
            <p className="mb-4">
              La SCI n&apos;a pas accès aux données personnelles ou de santé des patients.
            </p>
            <p className="mb-6">
              Le locataire est seul responsable du respect de la réglementation applicable en matière de protection des données.
            </p>

            {/* Article 12 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 12 – Engagement solidaire
            </h2>
            <p className="mb-4">
              Dans le cadre de son engagement sociétal, THÉRANICE s&apos;engage à reverser la somme de 1 euro par réservation
              confirmée à la Ligue contre le Cancer.
            </p>
            <p className="mb-4">
              Ce versement est effectué par la SCI THERA NICE à titre volontaire et indépendant.
            </p>
            <p className="mb-4">
              Il ne constitue pas un don effectué par le professionnel utilisateur et ne donne lieu à aucun reçu fiscal individuel.
            </p>
            <p className="mb-6">
              L&apos;Exploitant se réserve la possibilité de modifier, suspendre ou mettre fin à cet engagement
              pour des raisons économiques ou organisationnelles, sans que cela puisse engager sa responsabilité.
            </p>

            {/* Article 13 */}
            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ Article 13 – Suspension / Résiliation
            </h2>
            <p className="mb-4">
              Tout manquement aux présentes conditions ou au Règlement Intérieur pourra entraîner :
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Suspension temporaire du compte</li>
              <li>Refus de futures réservations</li>
              <li>Suppression définitive de l&apos;accès</li>
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
