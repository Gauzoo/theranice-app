'use client';

import Image from "next/image";
import Link from "next/link";
import { EB_Garamond } from "next/font/google";
import { useEffect, useState, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import LoginModal from "./LoginModal";
import { createClient } from "@/lib/supabase/client";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const NAV_LINKS = [
  { href: "/#hero", label: "Accueil", id: "hero" },
  { href: "/#nos-espaces", label: "Nos espaces", id: "nos-espaces" },
  { href: "/#forfait", label: "FAQ", id: "forfait" },
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
  const pathname = usePathname(); // Hook Next.js pour obtenir le chemin actuel
  const router = useRouter();
  const monCompteButtonRef = useRef<HTMLButtonElement>(null); // Référence au bouton Mon compte
  const dropdownRef = useRef<HTMLDivElement>(null); // Référence au menu déroulant
  
  // État pour savoir si on a scrollé (pour changer le style du header)
  const [isScrolled, setIsScrolled] = useState(false);
  // État pour savoir quelle section est actuellement visible
  const [activeSection, setActiveSection] = useState<string | null>(null);
  // État pour savoir si on est côté client (pour éviter l'hydration mismatch)
  const [isMounted, setIsMounted] = useState(false);
  // État pour le menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // État pour la modal de connexion
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  // État pour les infos utilisateur
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [userProfile, setUserProfile] = useState<{ nom?: string; prenom?: string; telephone?: string; therapie?: string } | null>(null);
  // État pour le menu déroulant
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Position du triangle pour le menu déroulant
  const [dropdownStyle, setDropdownStyle] = useState({
    trianglePosition: '64px'
  });

  // Détermine si on est sur la page d'accueil
  const isHomePage = pathname === "/";

  // Vérifie si l'utilisateur est connecté
  useEffect(() => {
    const supabase = createClient();
    
    // Récupère l'utilisateur actuel
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      
      // Si l'utilisateur est connecté, récupère son profil
      if (user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setUserProfile(data);
          });
      }
    });

    // Écoute les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            setUserProfile(data);
          });
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Surveille le scroll pour mettre à jour l'état du header
  useEffect(() => {
    // Indique qu'on est maintenant côté client
    setIsMounted(true);
    // Initialise activeSection côté client uniquement si on est sur la page d'accueil
    if (isHomePage) {
      setActiveSection("hero");
    } else {
      setActiveSection(null);
    }
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 160); // Si on a scrollé plus de 16px, isScrolled = true
    };

    handleScroll(); // Vérifie immédiatement au chargement
    window.addEventListener("scroll", handleScroll, { passive: true }); // Écoute les événements de scroll
    return () => window.removeEventListener("scroll", handleScroll); // Nettoyage à la destruction du composant
  }, [isHomePage]);

  // Calcule la position du triangle pour le menu déroulant
  useEffect(() => {
    const updateDropdownPosition = () => {
      if (isDropdownOpen && monCompteButtonRef?.current) {
        const buttonRect = monCompteButtonRef.current.getBoundingClientRect();
        
        // Position du triangle : au centre du bouton
        const buttonCenter = buttonRect.left + (buttonRect.width / 2);
        const modalRightEdge = buttonRect.right;
        const triangleFromRight = modalRightEdge - buttonCenter - 70;
        
        setDropdownStyle({
          trianglePosition: `${triangleFromRight}px`
        });
      }
    };

    updateDropdownPosition();
    
    // Écoute les changements de taille de fenêtre
    window.addEventListener('resize', updateDropdownPosition);
    
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [isDropdownOpen]);

  // Ferme le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Détecte quelle section est visible à l'écran
  useEffect(() => {
    // Ne surveille les sections que si on est sur la page d'accueil
    if (!isHomePage) return;
    
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
  }, [isHomePage]);

  // Gère la déconnexion
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
    router.refresh();
  };

  // Gère les clics sur les liens du menu
  const handleNavClick = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    href: string,
    targetId: string,
  ) => {
    // Ferme le menu mobile
    setIsMobileMenuOpen(false);
    
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
        <button
          onClick={() => {
            if (isHomePage) {
              // Si on est sur la page d'accueil, scroll vers le haut
              smoothScrollTo(0, HERO_DURATION);
            } else {
              // Si on est sur une autre page, navigue vers l'accueil
              window.location.href = "/";
            }
          }}
          className="flex items-center gap-4 cursor-pointer"
        >
          <Image
            src="/logo6sombre.png"
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
        </button>
        
        {/* Navigation + Bouton Mon compte regroupés */}
        <div className="hidden lg:flex items-center gap-6">
          {/* Menu desktop */}
          <nav>
            <ul className="flex items-center gap-6 text-lg font-medium uppercase tracking-wide"> 
              {NAV_LINKS.map((link) => {
                // Vérifie si ce lien correspond à la section active (seulement côté client et sur la page d'accueil)
                const isActive = isMounted && isHomePage && activeSection === link.id;
                
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
          
          {/* Bouton Mon compte / User menu */}
          {user ? (
            // Si l'utilisateur est connecté, affiche son prénom avec menu déroulant
            <div className="relative" ref={dropdownRef}>
              <button
                ref={monCompteButtonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`cursor-pointer rounded px-5 py-1.5 text-lg font-medium uppercase tracking-wide transition-colors duration-200 flex items-center gap-2 ${
                  isScrolled
                    ? "bg-[#D4A373] text-white hover:bg-[#c49363]" 
                    : "bg-[#333333] text-[#FFFFFF] hover:bg-[#D4A373]"
                }`}
              >
                {userProfile?.prenom || "Mon compte"}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>



              {/* Menu déroulant */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-[13px] w-48 z-[110]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {/* Triangle pointant vers le centre du bouton */}
                  <div 
                    style={{ right: dropdownStyle.trianglePosition }}
                    className="absolute -top-3 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-white"
                  ></div>
                  
                  <div className="bg-white rounded-md shadow-lg overflow-hidden">
                    <Link
                      href="/profil"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block w-full px-4 py-2.5 text-1xl font-semibold text-[#333333] hover:bg-[#FAEDCD] transition-colors"
                    >
                      Mon profil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-1xl font-semibold text-[#333333] hover:bg-[#FAEDCD] transition-colors cursor-pointer"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Si l'utilisateur n'est pas connecté, affiche "Mon compte"
            <>
              {/* Desktop : Modal */}
              <button
                ref={monCompteButtonRef}
                onClick={() => setIsLoginModalOpen(true)}
                className={`hidden lg:block cursor-pointer rounded px-5 py-1.5 text-lg font-medium uppercase tracking-wide transition-colors duration-200 ${
                  isScrolled
                    ? "bg-[#D4A373] text-white hover:bg-[#c49363]" 
                    : "bg-[#333333] text-[#FFFFFF] hover:bg-[#D4A373]"
                }`}
              >
                Mon compte
              </button>
              
              {/* Mobile : Lien vers /connexion */}
              <Link
                href="/connexion"
                className={`lg:hidden cursor-pointer rounded px-5 py-1.5 text-lg font-medium uppercase tracking-wide transition-colors duration-200 ${
                  isScrolled
                    ? "bg-[#D4A373] text-white hover:bg-[#c49363]" 
                    : "bg-[#333333] text-[#FFFFFF] hover:bg-[#D4A373]"
                }`}
              >
                Mon compte
              </Link>
            </>
          )}
        </div>




        {/* Bouton hamburger - visible seulement en mobile */}
        <button
          className="lg:hidden flex flex-col gap-1.5 w-8 h-8 justify-center items-center cursor-pointer"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
        >
          <span
            className={`block h-0.5 w-6 transition-all duration-300 ${
              isScrolled ? "bg-slate-900" : "bg-white"
            } ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 transition-all duration-300 ${
              isScrolled ? "bg-slate-900" : "bg-white"
            } ${isMobileMenuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 transition-all duration-300 ${
              isScrolled ? "bg-slate-900" : "bg-white"
            } ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>

        {/* Menu mobile - slide de droite */}
        <div
          className={`fixed top-0 right-0 h-screen w-64 bg-slate-50 z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Bouton de fermeture (croix) */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center cursor-pointer group"
            aria-label="Fermer le menu"
          >
            <span className="block w-6 h-0.5 bg-[#333333] group-hover:bg-[#D4A373] transition-colors duration-200 rotate-45 absolute" />
            <span className="block w-6 h-0.5 bg-[#333333] group-hover:bg-[#D4A373] transition-colors duration-200 -rotate-45 absolute" />
          </button>

          <nav className="flex flex-col gap-8 p-8 pt-24">
            {NAV_LINKS.map((link) => {
              const isActive = isMounted && isHomePage && activeSection === link.id;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(event) => handleNavClick(event, link.href, link.id)}
                  className={`text-lg font-medium uppercase tracking-wide transition-colors duration-200 ${
                    isActive
                      ? "text-[#D4A373]"
                      : "text-[#333333] hover:text-[#D4A373]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {/* Lien Mon compte / Profil dans le menu mobile */}
            {user ? (
              <>
                <Link
                  href="/profil"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-medium uppercase tracking-wide transition-colors duration-200 text-[#333333] hover:text-[#D4A373]"
                >
                  Mon profil
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="cursor-pointer text-lg font-medium uppercase tracking-wide transition-colors duration-200 text-[#333333] hover:text-[#D4A373] text-left"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                href="/connexion"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium uppercase tracking-wide transition-colors duration-200 text-[#333333] hover:text-[#D4A373]"
              >
                Mon compte
              </Link>
            )}
          </nav>
        </div>

        {/* Overlay sombre derrière le menu mobile */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>

      {/* Modal de connexion */}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        buttonRef={monCompteButtonRef}
      />
    </header>
  );
}
