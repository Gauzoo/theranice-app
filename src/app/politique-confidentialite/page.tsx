import Image from "next/image";
import { EB_Garamond } from "next/font/google";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Politique de confidentialité | Theranice",
  description: "Politique de confidentialité et protection des données personnelles - Theranice",
};

export default function PolitiqueConfidentialitePage() {
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
            Politique de confidentialité
          </h1>
        </div>
      </section>

      {/* Contenu */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="prose prose-slate max-w-none">
            
            <p className="text-lg mb-8">
              Theranice accorde une grande importance à la protection de vos données personnelles. 
              Cette politique de confidentialité vous informe sur la manière dont nous collectons, utilisons et protégeons vos données.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373]`}>
              ▸ 1. Responsable du traitement
            </h2>
            <p className="mb-6">
              <strong>Theranice</strong><br />
              Adresse : [Adresse complète à Nice]<br />
              Email : <a href="mailto:contact@theranice.fr" className="text-[#D4A373] hover:underline">contact@theranice.fr</a><br />
              Téléphone : [Numéro à compléter]
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 2. Données collectées
            </h2>
            <p className="mb-4">Nous collectons les données personnelles suivantes :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Données d'identification :</strong> Nom, prénom, adresse email, numéro de téléphone</li>
              <li><strong>Données professionnelles :</strong> Activité exercée</li>
              <li><strong>Documents :</strong> Carte d'identité, KBIS (pour la validation de votre compte professionnel)</li>
              <li><strong>Données de réservation :</strong> Dates, créneaux horaires, salles réservées</li>
              <li><strong>Données de paiement :</strong> Traitées de manière sécurisée par notre prestataire Stripe (nous ne conservons pas vos données bancaires)</li>
              <li><strong>Données de connexion :</strong> Adresse IP, logs de connexion (conservées par Supabase)</li>
            </ul>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 3. Finalités du traitement
            </h2>
            <p className="mb-4">Vos données personnelles sont collectées et traitées pour les finalités suivantes :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Gestion de votre compte utilisateur :</strong> Création et authentification</li>
              <li><strong>Validation de votre statut professionnel :</strong> Vérification de votre identité et activité</li>
              <li><strong>Gestion des réservations :</strong> Traitement de vos demandes de réservation de salles</li>
              <li><strong>Traitement des paiements :</strong> Facturation et encaissement via Stripe</li>
              <li><strong>Communication :</strong> Envoi d'emails de confirmation, d'annulation et de notifications</li>
              <li><strong>Respect de nos obligations légales :</strong> Comptabilité, facturation</li>
            </ul>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 4. Base légale
            </h2>
            <p className="mb-4">Le traitement de vos données personnelles repose sur les bases légales suivantes :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Exécution du contrat :</strong> Gestion de vos réservations et prestations</li>
              <li><strong>Consentement :</strong> Création de votre compte et upload de documents</li>
              <li><strong>Obligation légale :</strong> Conservation des données de facturation</li>
              <li><strong>Intérêt légitime :</strong> Sécurité du service et prévention de la fraude</li>
            </ul>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 5. Destinataires des données
            </h2>
            <p className="mb-4">Vos données personnelles sont accessibles aux personnes suivantes :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Personnel autorisé de Theranice :</strong> Pour la gestion des réservations et la validation des comptes</li>
              <li><strong>Prestataires techniques :</strong>
                <ul className="list-circle pl-6 mt-2 space-y-1">
                  <li>Supabase (hébergement base de données et authentification)</li>
                  <li>Vercel (hébergement du site web)</li>
                  <li>Stripe (traitement des paiements)</li>
                  <li>Resend (envoi d'emails transactionnels)</li>
                </ul>
              </li>
            </ul>
            <p className="mb-6">
              Ces prestataires sont soumis à des obligations contractuelles strictes garantissant la confidentialité et la sécurité de vos données.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 6. Durée de conservation
            </h2>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Données de compte actif :</strong> Conservées pendant toute la durée d'utilisation de votre compte</li>
              <li><strong>Données de réservation :</strong> 5 ans après la dernière réservation (obligation comptable)</li>
              <li><strong>Documents d'identité :</strong> Supprimés à votre demande ou après 1 an d'inactivité</li>
              <li><strong>Compte inactif :</strong> Suppression après 3 ans sans connexion (après notification préalable)</li>
              <li><strong>Logs de connexion :</strong> 12 mois maximum</li>
            </ul>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 7. Vos droits
            </h2>
            <p className="mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> Corriger vos données inexactes ou incomplètes</li>
              <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données</li>
              <li><strong>Droit à la limitation :</strong> Limiter le traitement de vos données dans certains cas</li>
              <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données</li>
              <li><strong>Droit de retirer votre consentement :</strong> À tout moment, sans affecter la licéité du traitement antérieur</li>
            </ul>
            <p className="mb-6">
              Pour exercer vos droits, contactez-nous à : 
              <a href="mailto:contact@theranice.fr" className="text-[#D4A373] hover:underline"> contact@theranice.fr</a>
            </p>
            <p className="mb-6">
              Nous nous engageons à répondre à votre demande dans un délai d'un mois maximum.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 8. Sécurité des données
            </h2>
            <p className="mb-6">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles 
              contre la destruction accidentelle ou illicite, la perte, l'altération, la divulgation ou l'accès non autorisé :
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Chiffrement des données en transit (HTTPS/SSL)</li>
              <li>Chiffrement des données sensibles en base de données</li>
              <li>Authentification sécurisée (Supabase Auth)</li>
              <li>Accès restreint aux données par mot de passe et contrôle d'accès</li>
              <li>Sauvegardes régulières</li>
              <li>Hébergement sur des serveurs sécurisés (Vercel, Supabase)</li>
            </ul>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 9. Transfert de données hors UE
            </h2>
            <p className="mb-6">
              Certains de nos prestataires (Vercel, Supabase) peuvent stocker des données sur des serveurs situés hors de l'Union Européenne. 
              Ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types de la Commission Européenne, 
              certifications Privacy Shield, etc.) assurant un niveau de protection adéquat de vos données.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 10. Cookies
            </h2>
            <p className="mb-6">
              Notre site utilise uniquement des cookies techniques strictement nécessaires au fonctionnement du service 
              (session d'authentification). Ces cookies ne nécessitent pas de consentement préalable car ils sont indispensables 
              à la fourniture du service que vous avez demandé.
            </p>
            <p className="mb-6">
              Nous n'utilisons pas de cookies de tracking, de publicité ou d'analyse statistique.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 11. Réclamation
            </h2>
            <p className="mb-6">
              Si vous estimez que le traitement de vos données personnelles constitue une violation de la réglementation applicable, 
              vous avez le droit d'introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) :
            </p>
            <p className="mb-6">
              <strong>CNIL</strong><br />
              3 Place de Fontenoy<br />
              TSA 80715<br />
              75334 PARIS CEDEX 07<br />
              Téléphone : 01 53 73 22 22<br />
              Site web : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#D4A373] hover:underline">www.cnil.fr</a>
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 12. Modifications
            </h2>
            <p className="mb-6">
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
              Toute modification sera publiée sur cette page avec une date de mise à jour. 
              Nous vous encourageons à consulter régulièrement cette page.
            </p>

            <h2 className={`${garamond.className} text-3xl font-semibold mb-4 text-[#D4A373] mt-12`}>
              ▸ 13. Contact
            </h2>
            <p className="mb-6">
              Pour toute question concernant cette politique de confidentialité ou le traitement de vos données personnelles, 
              vous pouvez nous contacter :
            </p>
            <p className="mb-6">
              <strong>Par email :</strong> <a href="mailto:contact@theranice.fr" className="text-[#D4A373] hover:underline">contact@theranice.fr</a><br />
              <strong>Par téléphone :</strong> [Numéro à compléter]<br />
              <strong>Par courrier :</strong> Theranice, [Adresse complète]
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
