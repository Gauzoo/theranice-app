import Image from "next/image";
import { EB_Garamond } from "next/font/google";
import FAQ from "@/components/FAQ";
import type { Metadata } from "next";
import { CONTACT_EMAIL } from '@/lib/constants';

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Questions fréquentes — Location salle thérapeute Nice",
  description:
    "Retrouvez les réponses à vos questions sur la location de salles thérapeutiques à Nice chez Théranice : tarifs, réservation, conditions d'accès, annulation et facturation.",
  keywords: [
    "FAQ location salle thérapeute Nice",
    "questions réservation cabinet thérapie Nice",
    "tarifs salle consultation Nice",
    "Théranice FAQ",
  ],
  alternates: { canonical: "/faq" },
};

const faqData = [
  {
    question: "Quel est le prix d'une demi-journée ou d'une journée ?",
    answer:
      "Les tarifs sont indiqués directement sur la plateforme de réservation lors du choix du créneau. Les prix sont exprimés en euros. TVA non applicable – article 293 B du CGI. Chaque réservation inclut l'accès aux espaces communs ainsi qu'aux équipements mentionnés dans la description des salles.",
  },
  {
    question: "Comment pratiquer chez THÉRANICE ?",
    answer:
      "Pour exercer au sein de THÉRANICE : 1) Créez votre profil professionnel sur la plateforme, 2) Attendez la validation de votre profil, 3) Réservez le créneau souhaité, 4) Procédez au paiement en ligne. Une fois le paiement confirmé, vous recevez les informations d'accès ainsi que le code de la serrure connectée pour la période réservée.",
  },
  {
    question: "THÉRANICE a-t-il un engagement solidaire ?",
    answer:
      "Oui. Pour chaque réservation effectuée, 1 € est reversé à la Ligue contre le Cancer. Cet engagement s'inscrit dans la volonté de THÉRANICE de soutenir une démarche responsable et solidaire.",
  },
  {
    question: "Quelles sont les règles d'utilisation des cabinets ?",
    answer:
      "Les espaces doivent être utilisés dans le respect du cadre professionnel du lieu, du matériel mis à disposition et des horaires réservés. Le cabinet doit être restitué propre, rangé et dans son état initial. Toute dégradation engage la responsabilité du professionnel utilisateur. L'acceptation du règlement intérieur est obligatoire lors de chaque réservation.",
  },
  {
    question: "Comment réserver un créneau ?",
    answer:
      "Depuis votre espace personnel : sélectionnez la salle souhaitée, choisissez un créneau disponible, validez et procédez au paiement. La réservation est confirmée après règlement. Un email de confirmation vous est immédiatement adressé.",
  },
  {
    question: "Y a-t-il un délai d'utilisation après réservation ?",
    answer:
      "La réservation est valable uniquement pour le créneau sélectionné. Toute annulation doit intervenir au minimum 14 jours avant la date réservée pour donner lieu à remboursement, conformément aux Conditions de mise à disposition.",
  },
  {
    question: "Quand recevrai-je ma facture ?",
    answer:
      "La facture est émise automatiquement à l'issue de la période de mise à disposition. Elle est transmise par email et reste disponible dans votre espace personnel.",
  },
  {
    question: "Quels professionnels peuvent exercer chez THÉRANICE ?",
    answer:
      "THÉRANICE accueille les professionnels de l'accompagnement et du soin : psychologues, coachs, sophrologues, hypnothérapeutes, praticiens en soins corporels et thérapies manuelles. Un numéro SIRET valide et une assurance responsabilité civile professionnelle en cours de validité sont requis.",
  },
  {
    question: "Quels espaces sont disponibles à la réservation ?",
    answer:
      "THÉRANICE propose trois configurations : le Salon Athéna (consultation individuelle), la Salle Gaïa (massage et soins corporels) et la Grande Salle (configuration modulable pour ateliers, formations et pratiques en groupe). Toutes les réservations incluent l'accès à la salle d'attente, la cuisine équipée et les sanitaires PMR.",
  },
  {
    question: "Où se situe THÉRANICE ?",
    answer:
      "THÉRANICE est situé au 19 rue Michelet, 06100 Nice, dans le quartier de la Libération. Les locaux sont accessibles PMR et ouverts du lundi au samedi de 7h30 à 20h30.",
  },
];

export default function FAQPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqData.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="bg-slate-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative isolate flex min-h-[40vh] items-center justify-center overflow-hidden pt-24 text-white">
        <Image
          src="/photos/covers2.jpg"
          alt="Espace Théranice — location de salle thérapeutique à Nice"
          fill
          className="absolute inset-0 object-cover"
          priority
        />
        <div
          className="absolute inset-0 bg-slate-900/50"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-4xl flex-col gap-4 px-6 py-16 text-center">
          <h1
            className={`${garamond.className} text-4xl font-semibold sm:text-5xl`}
          >
            Questions fréquentes
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/85">
            Tout ce que vous devez savoir sur la location de salles
            thérapeutiques à Nice chez THÉRANICE.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6">
          <FAQ
            items={faqData.map((item) => ({
              question: item.question,
              answer: <p>{item.answer}</p>,
            }))}
          />

          {/* CTA */}
          <div className="mt-12 border border-[#D4A373]/30 bg-[#FCFAF7] p-8 text-center">
            <h2
              className={`${garamond.className} text-2xl font-semibold text-[#D4A373]`}
            >
              Une question supplémentaire ?
            </h2>
            <p className="mt-4 text-slate-600">
              Contactez-nous à{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-[#D4A373] hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              ou consultez nos{" "}
              <a
                href="/conditions-generales"
                className="font-medium text-[#D4A373] hover:underline"
              >
                conditions générales
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
