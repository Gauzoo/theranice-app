import Image from "next/image";
import Link from "next/link";

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
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
            Espace thérapeutique partagé
          </p>
          <h1 className="text-4xl font-semibold sm:text-5xl">
            Louez un lieu apaisant pour vos séances à Nice
          </h1>
          <p className="max-w-2xl text-lg text-slate-100 sm:text-slate-200">
            Theranice met à disposition un espace chaleureux et équipé, réservé aux professionnels du bien-être. Sélectionnez un créneau demi-journée, réglez en ligne et recevez votre code d&apos;accès instantanément.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-start">
            <Link
              className="rounded-full bg-white/90 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-900 transition-colors hover:bg-white"
              href="/reservation"
            >
              Voir les disponibilités
            </Link>
            <Link
              className="rounded-full border border-white/80 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/10"
              href="/#contact"
            >
              Parler à l&apos;équipe
            </Link>
          </div>
        </div>
      </section>

  <section className="mx-auto max-w-6xl px-6 py-16 scroll-mt-24" id="nos-espaces">
        <h2 className="text-2xl font-semibold">Nos espaces</h2>
        <p className="mt-4 text-justify text-slate-600">
          Une salle lumineuse de 35 m² avec mobilier modulable, climatisation réversible, équipement audio, et connexion fibre. Idéale pour les consultations individuelles ou de petit groupe. Deuxième salle prévue prochainement.
        </p>
        <p className="mt-4 text-justify text-slate-600">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        </p>
        <p className="mt-4 text-justify text-slate-600">
          Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
        </p>
        <p className="mt-4 text-justify text-slate-600">
          Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
        </p>
      </section>

  <section className="mx-auto max-w-6xl px-6 py-16 scroll-mt-24" id="forfait">
        <h2 className="text-2xl font-semibold">Forfait demi-journée</h2>
        <ul className="mt-6 grid gap-3 text-slate-600">
          <li>• Matin ou après-midi (4 heures)</li>
          <li>• Accès libre au coin thé &amp; matériel de base</li>
          <li>• Code serrure connecté envoyé après confirmation</li>
          <li>• Annulation sans frais jusqu&apos;à 24h avant</li>
        </ul>
        <p className="mt-6 text-justify text-slate-600">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <p className="mt-4 text-justify text-slate-600">
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.
        </p>
        <p className="mt-4 text-justify text-slate-600">
          Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
        </p>
      </section>

  <section className="mx-auto max-w-6xl px-6 py-16 pb-32 scroll-mt-24" id="contact">
        <h2 className="text-2xl font-semibold">Contact</h2>
        <p className="mt-4 text-justify text-slate-600">
          Besoin d&apos;infos supplémentaires ou d&apos;une visite ? Écrivez-nous à contact@theranice.fr ou appelez le 06 00 00 00 00. Nous répondons sous 24 heures et proposons des visites sur rendez-vous.
        </p>
        <p className="mt-4 text-justify text-slate-600">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        </p>
        <p className="mt-4 text-justify text-slate-600">
          Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
        </p>
        <p className="mt-4 text-justify text-slate-600">
          Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.
        </p>
      </section>
    </div>
  );
}
