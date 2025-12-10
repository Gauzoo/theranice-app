import Image from "next/image";
import { EB_Garamond } from "next/font/google";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Conditions Générales d'Utilisation | Theranice",
  description: "Conditions générales d'utilisation du service de réservation Theranice",
};

export default function ConditionsGeneralesPage() {
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
            Conditions Générales d&apos;Utilisation
          </h1>
        </div>
      </section>

      {/* Contenu */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="prose prose-slate max-w-none">
            
            <p className="text-lg mb-8">
              Les présentes Conditions Générales d'Utilisation (CGU) définissent les règles d'accès et d'utilisation 
              du service de réservation de salles thérapeutiques proposé par Theranice.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373]`}>
              ▸ 1. Objet
            </h2>
            <p className="mb-6">
              Les présentes CGU ont pour objet de définir les conditions d'accès et d'utilisation de la plateforme de réservation 
              en ligne de salles thérapeutiques exploitée par Theranice, accessible à l'adresse [URL du site].
            </p>
            <p className="mb-6">
              L'utilisation du service implique l'acceptation pleine et entière des présentes CGU. 
              Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le service.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 2. Accès au service
            </h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">2.1. Public concerné</h3>
            <p className="mb-6">
              Le service est exclusivement réservé aux professionnels du bien-être et de la thérapie 
              (thérapeutes, sophrologues, hypnothérapeutes, coachs, etc.) exerçant leur activité de manière légale.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2. Inscription</h3>
            <p className="mb-4">Pour accéder au service de réservation, vous devez :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Créer un compte utilisateur en fournissant des informations exactes et à jour</li>
              <li>Être majeur et avoir la capacité juridique de contracter</li>
              <li>Fournir les documents justificatifs demandés (carte d'identité, KBIS ou équivalent)</li>
              <li>Attendre la validation de votre compte par l'administrateur</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.3. Validation du compte</h3>
            <p className="mb-6">
              Theranice se réserve le droit de valider ou refuser toute demande de création de compte, 
              sans avoir à justifier sa décision. La validation peut prendre jusqu'à 48 heures ouvrées.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.4. Identifiants</h3>
            <p className="mb-6">
              Vous êtes responsable de la confidentialité de vos identifiants de connexion. 
              Toute utilisation de votre compte est présumée avoir été effectuée par vous-même.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 3. Description du service
            </h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">3.1. Salles disponibles</h3>
            <p className="mb-4">Theranice met à disposition trois types de salles :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Salle 1 (35m²) :</strong> 50€ le demi-créneau, 90€ la journée complète</li>
              <li><strong>Salle 2 (35m²) :</strong> 50€ le demi-créneau, 90€ la journée complète</li>
              <li><strong>Grande salle (70m²) :</strong> 80€ le demi-créneau, 140€ la journée complète</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.2. Créneaux horaires</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Matin :</strong> 8h00 - 12h00</li>
              <li><strong>Après-midi :</strong> 13h00 - 17h00</li>
              <li><strong>Journée complète :</strong> 8h00 - 17h00</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.3. Équipements</h3>
            <p className="mb-6">
              Les salles sont équipées de [décrire l'équipement de base]. 
              Tout équipement supplémentaire doit être apporté par le professionnel.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 4. Réservations
            </h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">4.1. Processus de réservation</h3>
            <p className="mb-4">Pour effectuer une réservation, vous devez :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Sélectionner une ou plusieurs dates disponibles</li>
              <li>Choisir un créneau horaire et une salle</li>
              <li>Procéder au paiement en ligne via notre prestataire Stripe</li>
              <li>Recevoir une confirmation par email</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.2. Confirmation</h3>
            <p className="mb-6">
              La réservation n'est définitive qu'après validation du paiement. 
              Vous recevrez un email de confirmation contenant les détails de votre réservation et le code d'accès aux locaux.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.3. Disponibilité</h3>
            <p className="mb-6">
              Les disponibilités affichées sont mises à jour en temps réel. Toutefois, en cas de réservation simultanée, 
              seule la première validation de paiement sera prise en compte. 
              Dans ce cas rare, vous serez remboursé intégralement dans les 5 jours ouvrés.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 5. Paiement
            </h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">5.1. Tarifs</h3>
            <p className="mb-6">
              Les tarifs affichés sur le site sont exprimés en euros TTC. 
              Theranice se réserve le droit de modifier ses tarifs à tout moment, 
              mais les réservations déjà confirmées ne seront pas affectées.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.2. Modalités de paiement</h3>
            <p className="mb-6">
              Le paiement s'effectue en ligne par carte bancaire via la plateforme sécurisée Stripe. 
              Theranice ne conserve aucune donnée bancaire. 
              Le paiement est exigible immédiatement lors de la réservation.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.3. Facturation</h3>
            <p className="mb-6">
              Une facture vous sera envoyée par email après confirmation du paiement. 
              Vous pouvez également télécharger vos factures depuis votre espace client.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 6. Annulation et remboursement
            </h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">6.1. Annulation par le client</h3>
            <p className="mb-4">Vous pouvez annuler votre réservation selon les conditions suivantes :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Plus de 7 jours avant la date :</strong> Remboursement intégral</li>
              <li><strong>Entre 7 jours et 48 heures avant :</strong> Remboursement à hauteur de 50%</li>
              <li><strong>Moins de 48 heures avant :</strong> Aucun remboursement</li>
            </ul>
            <p className="mb-6">
              L'annulation s'effectue depuis votre espace "Mes réservations". 
              Le remboursement sera effectué sur le moyen de paiement utilisé sous 7 à 14 jours ouvrés.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">6.2. Annulation par Theranice</h3>
            <p className="mb-6">
              En cas de force majeure ou d'indisponibilité exceptionnelle de la salle, 
              Theranice se réserve le droit d'annuler votre réservation. 
              Vous serez alors remboursé intégralement et informé dans les meilleurs délais. 
              Theranice ne saurait être tenu responsable des éventuels préjudices subis.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 7. Utilisation des locaux
            </h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">7.1. Obligations du professionnel</h3>
            <p className="mb-4">En utilisant les locaux, vous vous engagez à :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Respecter les horaires réservés</li>
              <li>Laisser les lieux propres et en bon état</li>
              <li>Ne pas troubler le calme des autres utilisateurs</li>
              <li>Respecter le règlement intérieur affiché dans les locaux</li>
              <li>Ne pas sous-louer ou céder votre créneau à un tiers</li>
              <li>Disposer d'une assurance responsabilité civile professionnelle</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.2. Accès aux locaux</h3>
            <p className="mb-6">
              Un code d'accès vous sera communiqué par email après confirmation de votre réservation. 
              Ce code est personnel et ne doit pas être communiqué à des tiers.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.3. Dégradations</h3>
            <p className="mb-6">
              En cas de dégradation ou de vol de matériel, vous serez tenu financièrement responsable. 
              Le coût des réparations ou du remplacement vous sera facturé.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 8. Responsabilité
            </h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">8.1. Responsabilité de Theranice</h3>
            <p className="mb-6">
              Theranice met tout en œuvre pour assurer l'accès et le bon fonctionnement du service 24h/24 et 7j/7. 
              Toutefois, Theranice ne saurait être tenu responsable en cas d'interruption temporaire pour maintenance, 
              mise à jour ou panne technique.
            </p>
            <p className="mb-6">
              Theranice ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation du service 
              ou de l'impossibilité de l'utiliser.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">8.2. Responsabilité du professionnel</h3>
            <p className="mb-6">
              Vous êtes seul responsable de votre activité professionnelle exercée dans les locaux. 
              Vous devez disposer de toutes les autorisations et assurances nécessaires à l'exercice de votre profession. 
              Theranice ne saurait être tenu responsable des litiges entre vous et vos clients.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">8.3. Assurance</h3>
            <p className="mb-6">
              Vous devez disposer d'une assurance responsabilité civile professionnelle couvrant votre activité. 
              Une attestation pourra vous être demandée.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 9. Propriété intellectuelle
            </h2>
            <p className="mb-6">
              L'ensemble du contenu du site (textes, images, logos, vidéos, etc.) est la propriété exclusive de Theranice 
              et est protégé par les lois sur la propriété intellectuelle. 
              Toute reproduction, représentation ou utilisation, même partielle, est interdite sans autorisation expresse.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 10. Données personnelles
            </h2>
            <p className="mb-6">
              Le traitement de vos données personnelles est régi par notre 
              <a href="/politique-confidentialite" className="text-[#D4A373] hover:underline"> Politique de confidentialité</a>, 
              que nous vous invitons à consulter.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 11. Suspension et résiliation
            </h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">11.1. Suspension par Theranice</h3>
            <p className="mb-6">
              Theranice se réserve le droit de suspendre ou supprimer votre compte en cas de manquement aux présentes CGU, 
              de comportement inapproprié, ou d'utilisation frauduleuse du service, sans préavis ni indemnité.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">11.2. Résiliation par le client</h3>
            <p className="mb-6">
              Vous pouvez demander la suppression de votre compte à tout moment en nous contactant. 
              Vos données personnelles seront alors supprimées conformément à notre politique de confidentialité, 
              sous réserve des obligations légales de conservation.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 12. Modification des CGU
            </h2>
            <p className="mb-6">
              Theranice se réserve le droit de modifier les présentes CGU à tout moment. 
              Les nouvelles CGU seront portées à votre connaissance par publication sur le site. 
              Toute utilisation du service après modification vaut acceptation des nouvelles CGU.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 13. Droit applicable et juridiction
            </h2>
            <p className="mb-6">
              Les présentes CGU sont régies par le droit français. 
              En cas de litige, les parties s'efforceront de trouver une solution amiable. 
              À défaut, les tribunaux français seront seuls compétents.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 14. Médiation
            </h2>
            <p className="mb-6">
              Conformément à l'article L.612-1 du Code de la consommation, 
              nous vous informons que vous pouvez recourir gratuitement au service de médiation proposé par [Nom du médiateur], 
              en cas de litige non résolu avec notre service client.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 15. Contact
            </h2>
            <p className="mb-6">
              Pour toute question concernant les présentes CGU, vous pouvez nous contacter :
            </p>
            <p className="mb-6">
              <strong>Email :</strong> <a href="mailto:contact@theranice.fr" className="text-[#D4A373] hover:underline">contact@theranice.fr</a><br />
              <strong>Téléphone :</strong> [Numéro à compléter]<br />
              <strong>Adresse :</strong> Theranice, [Adresse complète]
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
