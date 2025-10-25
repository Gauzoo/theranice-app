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

          {/* Colonne 2 : Liens rapides */}
          <div>
            <h3 className="text-lg font-semibold text-[#D4A373] mb-4">Liens rapides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/#nos-espaces" className="hover:text-[#D4A373] transition-colors">
                  Nos espaces
                </a>
              </li>
              <li>
                <a href="/#forfait" className="hover:text-[#D4A373] transition-colors">
                  Forfait
                </a>
              </li>
              <li>
                <a href="/#contact" className="hover:text-[#D4A373] transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Contact */}
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
        </div>

        {/* Ligne de séparation */}
        <div className="border-t border-[#D4A373] mt-8 pt-8 text-center text-sm text-[#FEFAE0]">
          <p>&copy; {new Date().getFullYear()} Theranice. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
