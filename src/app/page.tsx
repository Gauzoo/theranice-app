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
    images: ["/photos/1.jpg"],
    description:
      "Un espace lumineux et structurant, idéal pour les consultations individuelles.",
    details:
      "Le Salon Athéna convient particulièrement aux psychologues, coachs, sophrologues, hypnothérapeutes et praticiens en accompagnement individuel.",
    alt: "Salon Athéna — espace de consultation individuelle pour thérapeutes à Nice",
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
    images: ["/photos/2.jpg"],
    description:
      "Un espace plus intimiste, parfaitement adapté aux pratiques nécessitant une table de massage.",
    details:
      "La Salle Gaïa est idéale pour les praticiens en soins corporels et thérapies manuelles.",
    alt: "Salle Gaïa — salle de massage et soins corporels pour praticiens à Nice",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://theranice.fr/#organization",
        name: "SCI THERA NICE",
        alternateName: "Théranice",
        description: "Location de salles thérapeutiques à Nice pour thérapeutes et praticiens bien-être.",
        url: "https://theranice.fr",
        telephone: "+33 6 65 46 26 42",
        email: "contact@theranice.fr",
        address: {
          "@type": "PostalAddress",
          streetAddress: "19 rue Michelet",
          addressLocality: "Nice",
          postalCode: "06100",
          addressCountry: "FR",
        },
        image: "https://theranice.fr/photos/covers1.jpg",
        priceRange: "8€–35€/h",
        openingHours: "Mo-Sa 08:00-20:00",
      },
      {
        "@type": "FAQPage",
        "@id": "https://theranice.fr/#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "Quel est le prix d'une demi-journée ou d'une journée ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Les tarifs sont indiqués directement sur la plateforme de réservation lors du choix du créneau. Les prix sont exprimés en euros. TVA non applicable – article 293 B du CGI. Chaque réservation inclut l'accès aux espaces communs ainsi qu'aux équipements mentionnés dans la description des salles.",
            },
          },
          {
            "@type": "Question",
            name: "Comment pratiquer chez THÉRANICE ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Pour exercer au sein de THÉRANICE : 1) Créez votre profil professionnel sur la plateforme, 2) Attendez la validation de votre profil, 3) Réservez le créneau souhaité, 4) Procédez au paiement en ligne. Une fois le paiement confirmé, vous recevez les informations d'accès ainsi que le code de la serrure connectée pour la période réservée.",
            },
          },
          {
            "@type": "Question",
            name: "THÉRANICE a-t-il un engagement solidaire ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Oui. Pour chaque réservation effectuée, 1 € est reversé à la Ligue contre le Cancer. Cet engagement s'inscrit dans la volonté de THÉRANICE de soutenir une démarche responsable et solidaire.",
            },
          },
          {
            "@type": "Question",
            name: "Quelles sont les règles d'utilisation des cabinets ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Les espaces doivent être utilisés dans le respect du cadre professionnel du lieu, du matériel mis à disposition et des horaires réservés. Le cabinet doit être restitué propre, rangé et dans son état initial. Toute dégradation engage la responsabilité du professionnel utilisateur.",
            },
          },
          {
            "@type": "Question",
            name: "Comment réserver un créneau ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Depuis votre espace personnel : sélectionnez la salle souhaitée, choisissez un créneau disponible, validez et procédez au paiement. La réservation est confirmée après règlement. Un email de confirmation vous est immédiatement adressé.",
            },
          },
          {
            "@type": "Question",
            name: "Y a-t-il un délai d'utilisation après réservation ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La réservation est valable uniquement pour le créneau sélectionné. Toute annulation doit intervenir au minimum 14 jours avant la date réservée pour donner lieu à remboursement, conformément aux Conditions de mise à disposition.",
            },
          },
          {
            "@type": "Question",
            name: "Quand recevrai-je ma facture ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La facture est émise automatiquement à l'issue de la période de mise à disposition. Elle est transmise par email et reste disponible dans votre espace personnel.",
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="bg-slate-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section
        className="relative isolate flex min-h-[84vh] items-center overflow-hidden pt-24 text-white"
        id="hero"
      >
        <Image
          src="/photos/covers1.jpg"
          alt="Espace Théranice — salle de consultation pour thérapeutes à Nice, lumineuse et chaleureuse"
          fill
          className="absolute inset-0 object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/52 to-slate-900/28" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,163,115,0.22),transparent_28%)]" aria-hidden="true" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 py-24 text-center sm:text-left">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.26em] text-white/90 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-[#D4A373]" aria-hidden="true" />
              Cabinet professionnel à Nice – quartier de la Libération
            </div>

            <h1 className={`${garamond.className} mt-7 text-5xl leading-[1.04] font-semibold sm:text-6xl lg:text-7xl`}>
              Des espaces calmes et soignés pour exercer avec sérénité.
            </h1>
            <p className="mt-10 text-sm uppercase tracking-[0.2em]">
              Un espace professionnel, serein et immédiatement opérationnel.
            </p>

            <div className="mt-6 inline-flex items-center gap-3 border border-white/15 bg-white/10 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
              <span className="text-base text-[#D4A373]" aria-hidden="true">♥</span>
              Pour chaque réservation confirmée, 1&nbsp;€ est reversé à la Ligue contre le Cancer.
            </div>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-start">
            <Link
              className="inline-flex items-center justify-center bg-[#D4A373] px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#c49363]"
              href="/reservation"
            >
              Voir les disponibilités
            </Link>
            <Link
              className="inline-flex items-center justify-center border border-white/20 bg-white/10 px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm transition-colors hover:bg-white/15"
              href="#nos-espaces"
            >
              Découvrir les espaces
            </Link>
            </div>


          </div>
        </div>
      </section>

      <section className="bg-[#FFFFFF] py-16 scroll-mt-24" id="nos-espaces">
        <div className="mx-auto max-w-6xl px-6">
          <div className="border border-slate-200 bg-[#FCFAF7] p-8 shadow-sm lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
              <div>
                <h2 className={`${garamond.className} text-4xl font-semibold text-[#D4A373]`}>
                  ▸ Nos espaces
                </h2>
                <p className="mt-6 text-justify text-lg leading-8 text-slate-600">
                  Des espaces pensés pour les professionnels de l&apos;accompagnement, dans un environnement calme, soigné et confidentiel.
                </p>
                <p className="mt-4 text-justify text-lg leading-8 text-slate-600">
                  THÉRANICE propose une solution souple et sécurisée, permettant aux thérapeutes d&apos;exercer sans les contraintes d&apos;un bail traditionnel. Vous réservez uniquement lorsque vous en avez besoin (à la journée ou à la demi-journée).
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="flex min-h-20 items-center justify-center border border-[#D4A373]/30 bg-[#F7F1EB] px-5 py-4 text-center text-sm font-medium uppercase tracking-[0.14em] text-slate-700">
                  Aucun engagement long terme
                </div>
                <div className="flex min-h-20 items-center justify-center border border-[#D4A373]/30 bg-[#F7F1EB] px-5 py-4 text-center text-sm font-medium uppercase tracking-[0.14em] text-slate-700">
                  Aucune gestion locative
                </div>
                <div className="flex min-h-20 items-center justify-center border border-[#D4A373]/30 bg-[#F7F1EB] px-5 py-4 text-center text-sm font-medium uppercase tracking-[0.14em] text-slate-700">
                  Aucune charge fixe
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            {spaces.map((space) => (
              <article
                key={space.name}
                className="flex h-full flex-col overflow-hidden border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-200 bg-[#F8F5F1] p-4">
                  {space.images.length === 1 ? (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-slate-200">
                      <Image
                        src={space.images[0]}
                        alt={space.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 48vw"
                      />
                    </div>
                  ) : (
                    <Carousel images={space.images} alt={space.name} />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-8 lg:p-10">
                  <h3 className={`${garamond.className} text-3xl font-semibold text-[#D4A373]`}>
                    {space.name}
                  </h3>
                  <p className="mt-4 text-justify text-lg leading-8 text-slate-700">{space.description}</p>
                  <p className="mt-4 text-slate-600">Équipements :</p>
                  <ul className="mt-4 grid gap-3 text-slate-600 sm:grid-cols-2">
                    {space.equipment.map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#D4A373]" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 border-t border-slate-200 pt-6 text-justify text-slate-700">{space.details}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-8">
            <div className="flex flex-col border border-slate-200 bg-[#FCFAF7] p-8 shadow-sm">
              <h3 className={`${garamond.className} text-3xl font-semibold text-[#D4A373]`}>
                Grande Salle
              </h3>
              <p className="mt-4 text-justify text-lg leading-8 text-slate-700">
                Configuration modulable avec possibilité d&apos;ouverture de la porte coulissante permettant l&apos;utilisation conjointe du Salon Athéna et de la Salle Gaïa, selon disponibilité et réservation.
              </p>
              <p className="mt-6 text-slate-600">Cette configuration est adaptée :</p>
              <ul className="mt-4 grid gap-3 text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                <li className="flex gap-3"><span className="text-[#D4A373]">●</span><span>Aux ateliers</span></li>
                <li className="flex gap-3"><span className="text-[#D4A373]">●</span><span>Aux formations</span></li>
                <li className="flex gap-3"><span className="text-[#D4A373]">●</span><span>Aux pratiques en petit groupe</span></li>
                <li className="flex gap-3"><span className="text-[#D4A373]">●</span><span>Aux séances nécessitant davantage d&apos;espace</span></li>
              </ul>
            </div>

            <div className="flex flex-col border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className={`${garamond.className} text-3xl font-semibold text-[#D4A373]`}>
                Espaces communs
              </h3>
              <p className="mt-4 text-justify text-lg leading-8 text-slate-700">
                Toutes les réservations incluent l&apos;accès aux espaces partagés.
              </p>
              <ul className="mt-6 grid gap-4 text-slate-600 sm:grid-cols-3">
                {sharedSpaces.map((item) => (
                  <li key={item} className="flex gap-3 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0 sm:border-b-0 sm:pb-0">
                    <span className="text-[#D4A373]">●</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-mt-24 bg-[#F7F3EE] py-20" id="forfait">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <h2 className={`${garamond.className} text-4xl font-semibold text-[#D4A373]`}>
                ▸ Foire aux questions
              </h2>
              <p className="mt-6 max-w-md text-lg leading-8 text-slate-600">
                Les réponses essentielles pour comprendre le fonctionnement de THÉRANICE, les réservations et les conditions d&apos;utilisation des cabinets.
              </p>
              <div className="mt-8 h-px w-24 bg-[#D4A373]" aria-hidden="true" />
              <p className="mt-8 max-w-md text-sm uppercase tracking-[0.18em] text-slate-500">
                Informations pratiques, acces, facturation et regles d&apos;usage.
              </p>
            </div>

            <div className="border border-[#D4A373]/20 bg-white p-4 shadow-sm sm:p-6">
              <FAQ
                items={[
                  {
                    question: "Quel est le prix d’une demi-journée ou d’une journée ?",
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
                    question: "Comment pratiquer chez THÉRANICE ?",
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
                    question: "THÉRANICE a-t-il un engagement solidaire ?",
                    answer: (
                      <div className="space-y-3">
                        <p>Oui.</p>
                        <p>Pour chaque réservation effectuée, 1 € est reversé à la Ligue contre le Cancer.</p>
                        <p>Cet engagement s&apos;inscrit dans la volonté de THÉRANICE de soutenir une démarche responsable et solidaire.</p>
                      </div>
                    )
                  },
                  {
                    question: "Quelles sont les règles d’utilisation des cabinets ?",
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
                    question: "Comment réserver un créneau ?",
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
                    question: "Y a-t-il un délai d’utilisation après réservation ?",
                    answer: (
                      <div className="space-y-3">
                        <p>La réservation est valable uniquement pour le créneau sélectionné.</p>
                        <p>Toute annulation doit intervenir au minimum 14 jours avant la date réservée pour donner lieu à remboursement, conformément aux Conditions de mise à disposition.</p>
                      </div>
                    )
                  },
                  {
                    question: "Quand recevrai-je ma facture ?",
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
        </div>
      </section>

      <section className="bg-[#FFFFFF] py-16  scroll-mt-24" id="contact">
        <div className="mx-auto max-w-6xl px-6">
        <h2 className={`${garamond.className} text-4xl text-[#D4A373] font-semibold`}>▸ Contact</h2>
        <p className="mt-6 text-slate-600">
          Besoin d&apos;infos supplémentaires ou d&apos;une visite ? Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais ou contactez-nous 
          directement par email à <strong>contact@theranice.fr</strong>.
        </p>
        
        <ContactForm />
        

        </div>
      </section>
    </div>
  );
}