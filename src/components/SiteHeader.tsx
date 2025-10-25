'use client';

import Image from "next/image";
import Link from "next/link";
import { EB_Garamond } from "next/font/google";
import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const NAV_LINKS = [
  { href: "/#hero", label: "Accueil", id: "hero" },
  { href: "/#nos-espaces", label: "Nos espaces", id: "nos-espaces" },
  { href: "/#forfait", label: "Forfait", id: "forfait" },
  { href: "/#contact", label: "Contact", id: "contact" },
];

const HEADER_OFFSET = 96;
const DEFAULT_DURATION = 100;
const HERO_DURATION = 200;

// Fonction mathématique pour créer une animation fluide (démarre vite, ralentit à la fin)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// Fait défiler la page de manière animée vers une position Y donnée
const smoothScrollTo = (targetY: number, duration: number) => {
  const startY = window.scrollY; // Position de départ

  const distance = targetY - startY; // Distance à parcourir
  let startTime: number | null = null; // Horodatage de départ

  const step = (currentTime: number) => {
    if (startTime === null) startTime = currentTime; // Enregistre le temps au 1er appel
    const elapsed = currentTime - startTime; // Temps écoulé depuis le début
    const progress = Math.min(elapsed / duration, 1); // Progression entre 0 et 1
    const eased = easeOutCubic(progress); // Applique la courbe d'animation
    window.scrollTo(0, startY + distance * eased); // Déplace la fenêtre
    if (progress < 1) requestAnimationFrame(step); // Continue tant qu'on n'est pas arrivé
  };

  requestAnimationFrame(step); // Lance l'animation
};

export default function SiteHeader() {
  // État pour savoir si on a scrollé (pour changer le style du header)
  const [isScrolled, setIsScrolled] = useState(false);
  // État pour savoir quelle section est actuellement visible
  const [activeSection, setActiveSection] = useState<string | null>(null);
  // État pour savoir si on est côté client (pour éviter l'hydration mismatch)
  const [isMounted, setIsMounted] = useState(false);

  // Surveille le scroll pour mettre à jour l'état du header
  useEffect(() => {
    // Indique qu'on est maintenant côté client
    setIsMounted(true);
    // Initialise activeSection côté client uniquement
    setActiveSection("hero");
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 160); // Si on a scrollé plus de 16px, isScrolled = true
    };

    handleScroll(); // Vérifie immédiatement au chargement
    window.addEventListener("scroll", handleScroll, { passive: true }); // Écoute les événements de scroll
    return () => window.removeEventListener("scroll", handleScroll); // Nettoyage à la destruction du composant
  }, []);

  // Détecte quelle section est visible à l'écran
  useEffect(() => {
    // Observer qui surveille quand les sections entrent dans le viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Si la section est visible, on met à jour l'état
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        // La section doit être à 30% dans le haut du viewport pour être considérée active
        rootMargin: "-30% 0px -70% 0px",
        threshold: 0,
      }
    );

    // On observe toutes les sections
    NAV_LINKS.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    // Nettoyage quand le composant est détruit
    return () => observer.disconnect();
  }, []);

  // Gère les clics sur les liens du menu
  const handleNavClick = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    href: string,
    targetId: string,
  ) => {
    const hashIndex = href.indexOf("#"); // Cherche si le lien contient une ancre (#)

    // Cas spécial : clic sur "Accueil" quand on est déjà sur la page d'accueil
    if (href === "/" && window.location.pathname === "/") {
      event.preventDefault(); // Empêche le comportement par défaut du lien
      smoothScrollTo(0, HERO_DURATION); // Remonte tout en haut rapidement
      return;
    }

    // Si pas d'ancre ou qu'on n'est pas sur la page d'accueil, laisse le navigateur gérer
    if (hashIndex === -1 || window.location.pathname !== "/") return;

    // Trouve l'élément HTML correspondant à l'ancre
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return; // Si l'élément n'existe pas, abandonne

    event.preventDefault(); // Empêche le saut brusque par défaut
    const { top } = targetElement.getBoundingClientRect(); // Position de l'élément par rapport au viewport
    const targetY = top + window.scrollY - HEADER_OFFSET; // Calcule la position finale (en tenant compte du header fixe)
    const duration = targetId === "hero" ? HERO_DURATION : DEFAULT_DURATION; // Durée adaptée selon la section
    smoothScrollTo(targetY, duration); // Lance le scroll animé
  };

  // Classes CSS du header : fond blanc si on a scrollé, transparent sinon
  const headerClasses = isScrolled
    ? "bg-white/90 text-slate-900 shadow-sm backdrop-blur" // Header scrollé : fond blanc semi-transparent avec ombre
    : "bg-transparent text-white"; // Header en haut : transparent avec texte blanc

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ease-out ${headerClasses}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Image
            src="/logosombre.svg"
            alt="Theranice"
            width={120}
            height={120}
            className="h-16 w-auto object-contain drop-shadow"
            priority
          />
          <span
            className={`${garamond.className} text-3xl font-semibold uppercase tracking-[0.05em] ${
              isScrolled ? "text-slate-900" : "text-white"
            }`}
          >
            THÉRANICE
          </span>
        </div>
        
        <nav>
          <ul className="flex items-center gap-6 text-lg font-medium uppercase tracking-wide"> 
            {NAV_LINKS.map((link) => {
              // Vérifie si ce lien correspond à la section active (seulement côté client)
              const isActive = isMounted && activeSection === link.id;
              
              // Définit la couleur du lien
              let linkColor = "";
              if (isActive) {
                // Section active = doré
                linkColor = "text-[#D4A373]";
              } else if (isScrolled) {
                // Header scrollé = gris foncé avec hover doré
                linkColor = "text-[#333333] hover:text-[#D4A373]";
              } else {
                // Header transparent = blanc avec hover doré
                linkColor = "text-white hover:text-[#D4A373]";
              }
              
              return (
                <li key={link.href}>
                  <Link
                    className={`transition-colors duration-200 ${linkColor}`}
                    href={link.href}
                    onClick={(event) => handleNavClick(event, link.href, link.id)}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
