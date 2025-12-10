import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-[#333333] text-[#FEFAE0]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Colonne 1 : À propos */}
          <div>
            <h3 className="text-lg font-semibold text-[#D4A373] mb-4">Theranice</h3>
            <p className="text-sm leading-relaxed">
              Espace thérapeutique partagé à Nice. Location de salles équipées pour les professionnels du bien-être.
            </p>
          </div>

          {/* Colonne 2 : Contact */}
          <div>
            <h3 className="text-lg font-semibold text-[#D4A373] mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:contact@theranice.fr" className="hover:text-[#D4A373] transition-colors">
                  contact@theranice.fr
                </a>
              </li>
              <li>
                <a href="tel:0600000000" className="hover:text-[#D4A373] transition-colors">
                  06 00 00 00 00
                </a>
              </li>
              <li className="text-[#D4A373]">
                Nice, France
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Mentions et conformité */}
          <div>
            <h3 className="text-lg font-semibold text-[#D4A373] mb-4">Mentions et conformité</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/mentions-legales" className="hover:text-[#D4A373] transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/politique-confidentialite" className="hover:text-[#D4A373] transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href="/conditions-generales" className="hover:text-[#D4A373] transition-colors">
                  Conditions générales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="border-t border-[#D4A373] mt-8 pt-8 text-center text-sm text-[#FEFAE0]">
          <p>&copy; {new Date().getFullYear()} Theranice. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
