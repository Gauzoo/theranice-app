import Image from "next/image";
import Link from "next/link";
import Carousel from "@/components/Carousel";
import FAQ from "@/components/FAQ";
import ContactForm from "@/components/ContactForm";
import { EB_Garamond } from "next/font/google";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaces = [
  {
    name: "Salon Athéna",
    image: "/photos/1.jpg",
    description:
      "Un espace lumineux et structurant, idéal pour les consultations individuelles.",
    details:
      "Le Salon Athéna convient particulièrement aux psychologues, coachs, sophrologues, hypnothérapeutes et praticiens en accompagnement individuel.",
    equipment: [
      "Deux fauteuils de consultation",
      "Un bureau",
      "Des chaises",
      "Un plaid",
      "Lampe d'appoint",
      "Accès à un ampli Bluetooth",
      "Connexion fibre",
      "Récepteur de sonnette d'entrée",
      "Ouverture de la porte d'entrée depuis la salle",
      "Climatisation réversible",
      "Table de massage sur demande",
    ],
  },
  {
    name: "Salle Gaïa",
    image: "/photos/2.jpg",
    description:
      "Un espace plus intimiste, parfaitement adapté aux pratiques nécessitant une table de massage.",
    details:
      "La Salle Gaïa est idéale pour les praticiens en soins corporels et thérapies manuelles.",
    equipment: [
      "Table de massage et accessoires",
      "Bureau pliable",
      "Une chaise",
      "Tabouret roulant",
      "Plaid",
      "Lave-mains",
      "Essuie-mains",
      "Accès à un ampli Bluetooth",
      "Connexion fibre",
      "Récepteur de sonnette d'entrée",
      "Ouverture de la porte d'entrée depuis la salle",
      "Climatisation réversible",
    ],
  },
];

const sharedSpaces = [
  "Salle d'attente",
  "Cuisine équipée (café et tisanes à disposition)",
  "Sanitaires accessibles PMR",
];

export default function Home() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <section
        className="relative isolate flex min-h-[80vh] items-center justify-center overflow-hidden pt-24 text-white"
        id="hero"
      >
        <Image
          src="/photos/covers1.jpg"
          alt="Salle Theranice lumineuse et chaleureuse"
          fill
          className="absolute inset-0 object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-900/40" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-4xl flex-col gap-6 px-6 py-24 text-center sm:text-left">
  
          <h1 className="text-4xl font-semibold sm:text-5xl">
            Des espaces pensés pour les professionnels de l&apos;accompagnement à Nice
          </h1>
          <p className="max-w-2xl text-lg text-slate-100 sm:text-slate-200">
            THÉRANICE propose une solution souple et sécurisée, permettant aux thérapeutes d&apos;exercer sans les contraintes d&apos;un bail traditionnel.
          </p>
          <div className="flex flex-wrap gap-3 text-sm font-medium uppercase tracking-[0.18em] text-slate-100/90">
            <span>Aucun engagement long terme</span>
            <span>Aucune gestion locative</span>
            <span>Aucune charge fixe</span>
          </div>
          <p className="max-w-2xl text-base text-slate-100 sm:text-slate-200">
            Vous réservez uniquement lorsque vous en avez besoin.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-start">
            <Link
              className=" bg-white/90 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-900 transition-colors hover:bg-white"
              href="/reservation"
            >
              Voir les disponibilités
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#FFFFFF] py-16 scroll-mt-24" id="nos-espaces">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <h2 className={`${garamond.className} text-4xl font-semibold text-[#D4A373]`}>
                ▸ Nos espaces
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Des espaces pensés pour les professionnels de l&apos;accompagnement, dans un environnement calme, soigné et confidentiel.
              </p>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                THÉRANICE propose une solution souple et sécurisée, permettant aux thérapeutes d&apos;exercer sans les contraintes d&apos;un bail traditionnel.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="border border-[#D4A373]/30 bg-[#F7F1EB] px-5 py-4 text-sm font-medium uppercase tracking-[0.14em] text-slate-700">
                  Aucun engagement long terme
                </div>
                <div className="border border-[#D4A373]/30 bg-[#F7F1EB] px-5 py-4 text-sm font-medium uppercase tracking-[0.14em] text-slate-700">
                  Aucune gestion locative
                </div>
                <div className="border border-[#D4A373]/30 bg-[#F7F1EB] px-5 py-4 text-sm font-medium uppercase tracking-[0.14em] text-slate-700 sm:col-span-2">
                  Aucune charge fixe à supporter. Vous réservez uniquement lorsque vous en avez besoin.
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] bg-slate-900 p-4 text-white shadow-xl">
              <Carousel
                images={[
                  "/photos/1.jpg",
                  "/photos/2.jpg",
                  "/photos/3.jpg"
                ]}
              />
            </div>
          </div>

          <div className="mt-14 grid gap-8">
            {spaces.map((space, index) => (
              <article
                key={space.name}
                className="grid overflow-hidden border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.95fr_1.05fr]"
              >
                <div className={`relative min-h-[320px] ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                  <Image
                    src={space.image}
                    alt={space.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 45vw"
                  />
                </div>
                <div className="p-8 lg:p-10">
                  <h3 className={`${garamond.className} text-3xl font-semibold text-[#D4A373]`}>
                    {space.name}
                  </h3>
                  <p className="mt-4 text-lg leading-8 text-slate-700">{space.description}</p>
                  <p className="mt-4 text-slate-600">Équipements :</p>
                  <ul className="mt-4 grid gap-3 text-slate-600 sm:grid-cols-2">
                    {space.equipment.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-1 text-[#D4A373]">●</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 border-t border-slate-200 pt-6 text-slate-700">{space.details}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border border-slate-200 bg-[#FCFAF7] p-8 shadow-sm">
              <h3 className={`${garamond.className} text-3xl font-semibold text-[#D4A373]`}>
                Grande Salle
              </h3>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                Configuration modulable avec possibilité d&apos;ouverture de la porte coulissante permettant l&apos;utilisation conjointe du Salon Athéna et de la Salle Gaïa, selon disponibilité et réservation.
              </p>
              <p className="mt-6 text-slate-600">Cette configuration est adaptée :</p>
              <ul className="mt-4 grid gap-3 text-slate-600 sm:grid-cols-2">
                <li className="flex gap-3"><span className="text-[#D4A373]">●</span><span>Aux ateliers</span></li>
                <li className="flex gap-3"><span className="text-[#D4A373]">●</span><span>Aux formations</span></li>
                <li className="flex gap-3"><span className="text-[#D4A373]">●</span><span>Aux pratiques en petit groupe</span></li>
                <li className="flex gap-3"><span className="text-[#D4A373]">●</span><span>Aux séances nécessitant davantage d&apos;espace</span></li>
              </ul>
            </div>

            <div className="border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className={`${garamond.className} text-3xl font-semibold text-[#D4A373]`}>
                Espaces communs
              </h3>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                Toutes les réservations incluent l&apos;accès aux espaces partagés.
              </p>
              <ul className="mt-6 grid gap-4 text-slate-600">
                {sharedSpaces.map((item) => (
                  <li key={item} className="flex gap-3 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                    <span className="text-[#D4A373]">●</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#FFFFFF] py-16 scroll-mt-24" id="forfait">
        <div className="mx-auto max-w-6xl px-6">
        <h2 className={`${garamond.className} text-4xl text-[#D4A373] font-semibold`}>▸ Foire aux questions</h2>
        <p className="mt-6 max-w-3xl text-slate-600">
          Les réponses essentielles pour comprendre le fonctionnement de THÉRANICE, les réservations et les conditions d&apos;utilisation des cabinets.
        </p>
        
        <div className="mt-8 " >
          <FAQ
            items={[
              {
                question: "▸ Quel est le prix d’une demi-journée ou d’une journée ?",
                answer: (
                  <div className="space-y-3">
                    <p>Les tarifs sont indiqués directement sur la plateforme de réservation lors du choix du créneau.</p>
                    <p>Les prix sont exprimés en euros.</p>
                    <p>TVA non applicable – article 293 B du CGI.</p>
                    <p>Chaque réservation inclut l&apos;accès aux espaces communs ainsi qu&apos;aux équipements mentionnés dans la description des salles.</p>
                  </div>
                )
              },
              {
                question: "▸ Comment pratiquer chez THÉRANICE ?",
                answer: (
                  <div className="space-y-3">
                    <p>Pour exercer au sein de THÉRANICE :</p>
                    <ol className="list-decimal space-y-2 pl-6">
                      <li>Créez votre profil professionnel sur la plateforme</li>
                      <li>Attendez la validation de votre profil</li>
                      <li>Réservez le créneau souhaité</li>
                      <li>Procédez au paiement en ligne</li>
                    </ol>
                    <p>Une fois le paiement confirmé, vous recevez les informations d&apos;accès, ainsi que le code de la serrure connectée pour la période réservée.</p>
                    <p>Les espaces sont exclusivement destinés aux professionnels de l&apos;accompagnement et du soin.</p>
                  </div>
                )
              },
              {
                question: "▸ THÉRANICE a-t-il un engagement solidaire ?",
                answer: (
                  <div className="space-y-3">
                    <p>Oui.</p>
                    <p>Pour chaque réservation effectuée, 1 € est reversé à la Ligue contre le Cancer.</p>
                    <p>Cet engagement s&apos;inscrit dans la volonté de THÉRANICE de soutenir une démarche responsable et solidaire.</p>
                  </div>
                )
              },
              {
                question: "▸ Quelles sont les règles d’utilisation des cabinets ?",
                answer: (
                  <div className="space-y-3">
                    <p>Les espaces doivent être utilisés dans le respect :</p>
                    <ul className="list-disc space-y-2 pl-6">
                      <li>du cadre professionnel du lieu</li>
                      <li>du matériel mis à disposition</li>
                      <li>des horaires réservés</li>
                    </ul>
                    <p>Le cabinet doit être restitué propre, rangé et dans son état initial.</p>
                    <p>Toute dégradation engage la responsabilité du professionnel utilisateur.</p>
                    <p>L&apos;acceptation du règlement intérieur est obligatoire lors de chaque réservation.</p>
                  </div>
                )
              },
              {
                question: "▸ Comment réserver un créneau ?",
                answer: (
                  <div className="space-y-3">
                    <p>Depuis votre espace personnel :</p>
                    <ul className="list-disc space-y-2 pl-6">
                      <li>Sélectionnez la salle souhaitée</li>
                      <li>Choisissez un créneau disponible</li>
                      <li>Validez et procédez au paiement</li>
                    </ul>
                    <p>La réservation est confirmée après règlement.</p>
                    <p>Un email de confirmation vous est immédiatement adressé.</p>
                  </div>
                )
              },
              {
                question: "▸ Y a-t-il un délai d’utilisation après réservation ?",
                answer: (
                  <div className="space-y-3">
                    <p>La réservation est valable uniquement pour le créneau sélectionné.</p>
                    <p>Toute annulation doit intervenir au minimum 14 jours avant la date réservée pour donner lieu à remboursement, conformément aux Conditions de mise à disposition.</p>
                  </div>
                )
              },
              {
                question: "▸ Quand recevrai-je ma facture ?",
                answer: (
                  <div className="space-y-3">
                    <p>La facture est émise automatiquement à l&apos;issue de la période de mise à disposition.</p>
                    <p>Elle est transmise par email et reste disponible dans votre espace personnel.</p>
                  </div>
                )
              }
            ]}
          />
        </div>
        </div>
      </section>

      <section className="bg-[#FFFFFF] py-16 pb-32 scroll-mt-24" id="contact">
        <div className="mx-auto max-w-6xl px-6">
        <h2 className={`${garamond.className} text-4xl text-[#D4A373] font-semibold`}>▸ Contact</h2>
        <p className="mt-6 text-slate-600">
          Besoin d&apos;infos supplémentaires ou d&apos;une visite ? Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
        </p>
        
        <ContactForm />
        
        <div className="mt-8 text-center text-slate-600">
          <p>Vous pouvez également nous contacter directement :</p>
          <p className="mt-2">
            <strong>Email :</strong> contact@theranice.fr
          </p>
          <p className="mt-1">
            <strong>Téléphone :</strong> 06 00 00 00 00
          </p>
        </div>
        </div>
      </section>
    </div>
  );
}