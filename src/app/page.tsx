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
            Louez un lieu apaisant pour vos séances à Nice
          </h1>
          <p className="max-w-2xl text-lg text-slate-100 sm:text-slate-200">
            Theranice met à disposition un espace chaleureux et équipé, réservé aux professionnels du bien-être. Sélectionnez un créneau demi-journée, réglez en ligne et recevez votre code d&apos;accès instantanément.
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
        <h2 className={`${garamond.className} text-4xl text-[#D4A373] font-semibold`}>▸ Nos espaces</h2>

        <h3 className="mt-6 text-xl font-semibold text-[#333333]">Nice Valrose</h3>
        <p className="mt-4 text-justify text-slate-600">
          Une salle lumineuse de 35 m² avec mobilier modulable, climatisation réversible, équipement audio, et connexion fibre. Idéale pour les consultations individuelles ou de petit groupe. Deuxième salle prévue prochainement.
        </p>
        
        {/* Carrousel de photos */}
        <div className="mt-8">
          <Carousel 
            images={[
              "/photos/1.jpg",
              "/photos/2.jpg",
              "/photos/3.jpg"
            ]} 
          />
        </div>
        
        {/* Équipements */}
        <div className="mt-8 border-2 border-[#D4A373] bg-white p-6 shadow-sm">
          <h4 className="text-xl font-semibold text-[#333333]">Équipements disponibles</h4>
          <ul className="mt-4 grid grid-cols-1 gap-3 text-slate-600 sm:grid-cols-2 md:grid-cols-3">
            <li className="flex items-center gap-2">
              <span className="text-[#D4A373]">✓</span>
              Équipement 1
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#D4A373]">✓</span>
              Équipement 2
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#D4A373]">✓</span>
              Équipement 3
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#D4A373]">✓</span>
              Équipement 4
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#D4A373]">✓</span>
              Équipement 5
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#D4A373]">✓</span>
              Équipement 6
            </li>
          </ul>
        </div>
        
        <p className="mt-8 text-justify text-slate-600">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        </p>
        <p className="mt-4 text-justify text-slate-600">
          Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
        </p>
        <p className="mt-4 text-justify text-slate-600">
          Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
        </p>
        </div>
      </section>

      <section className="bg-[#FFFFFF] py-16 scroll-mt-24" id="forfait">
        <div className="mx-auto max-w-6xl px-6">
        <h2 className={`${garamond.className} text-4xl text-[#D4A373] font-semibold`}>▸ Foire aux questions</h2>
        <p className="mt-6 text-slate-600">
          Découvrez nos forfaits flexibles et nos conditions d&apos;utilisation.
        </p>
        
        <div className="mt-8 " >
          <FAQ
            items={[
              {
                question: "▸ Quel est le prix d'une demi-journée ?",
                answer: "Le tarif pour une demi-journée (4 heures) est de XX€. Ce tarif inclut l'accès à la salle équipée, le coin thé, le matériel de base, et le code d'accès sécurisé. Des forfaits avec plusieurs créneaux sont également disponibles à tarif préférentiel."
              },
              {
                question: "▸ Comment pratiquer chez THÉRANICE ?",
                answer: "Pour pratiquer chez THÉRANICE, il vous suffit d'acheter un forfait demi-journée via notre plateforme de réservation en ligne. Une fois votre paiement confirmé, vous recevrez un code d'accès pour la serrure connectée."
              },
              {
                question: "▸ Quels sont les règles d'utilisation des cabinets ?",
                answer: "Les cabinets doivent être utilisés dans le respect des autres praticiens. Merci de laisser l'espace propre et rangé après votre passage. Le matériel mis à disposition doit être utilisé avec soin. Toute dégradation sera facturée."
              },
              {
                question: "▸ Comment acheter un forfait ?",
                answer: "L'achat d'un forfait se fait directement en ligne via notre système de réservation. Sélectionnez votre créneau (matin ou après-midi), procédez au paiement sécurisé, et recevez instantanément votre confirmation avec le code d'accès."
              },
              {
                question: "▸ Y a-t-il un délai d'utilisation des forfaits ?",
                answer: "Les forfaits achetés sont valables pour la date et le créneau sélectionnés lors de la réservation. Ils ne sont pas reportables, sauf en cas d'annulation effectuée au moins 24h avant le créneau réservé."
              },
              {
                question: "▸ Comment réserver un créneau ?",
                answer: "Consultez le calendrier des disponibilités sur notre plateforme, choisissez le jour et le créneau souhaité (matin 8h-12h ou après-midi 13h-17h), puis validez votre réservation en procédant au paiement."
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