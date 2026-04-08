import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Théranice — Location de salles pour thérapeutes à Nice",
    template: "%s | Théranice",
  },
  description: "Théranice propose des salles thérapeutiques à Nice, équipées et calmes, pour thérapeutes et praticiens bien-être. Réservez votre espace en quelques clics.",
  keywords: ["location salle thérapeute Nice", "cabinet consultation Nice", "salle massage Nice", "espace bien-être professionnel Nice", "location bureau thérapeute", "cabinet thérapie Nice", "salle sophrologie Nice", "location salle hypnothérapie Nice", "Théranice"],
  metadataBase: new URL("https://theranice.fr"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://theranice.fr",
    siteName: "Théranice",
    title: "Théranice — Location de salles pour thérapeutes à Nice",
    description: "Des espaces calmes et soignés pour exercer avec sérénité. Salon Athéna, Salle Gaïa, Grande Salle — à partir de 8€/h.",
    images: [
      {
        url: "/photos/covers1.jpg",
        width: 1200,
        height: 630,
        alt: "Salle Théranice lumineuse et chaleureuse à Nice",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Théranice — Location de salles pour thérapeutes à Nice",
    description: "Des espaces calmes et soignés pour exercer avec sérénité. Réservez votre salle thérapeutique à Nice.",
    images: ["/photos/covers1.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://theranice.fr/#organization",
    name: "Théranice",
    legalName: "SCI THERA NICE",
    url: "https://theranice.fr",
    logo: "https://theranice.fr/logo6sombre.png",
    email: "contact@theranice.fr",
    telephone: "+33 6 65 46 26 42",
    address: {
      "@type": "PostalAddress",
      streetAddress: "19 rue Michelet",
      addressLocality: "Nice",
      postalCode: "06100",
      addressRegion: "Provence-Alpes-Côte d'Azur",
      addressCountry: "FR",
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://theranice.fr/#website",
    name: "Théranice",
    url: "https://theranice.fr",
    publisher: { "@id": "https://theranice.fr/#organization" },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: "https://theranice.fr",
      },
    ],
  };

  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${poppins.className} antialiased`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <AuthProvider>
          <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
            <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-[#D4A373] focus:text-white focus:px-4 focus:py-2">
              Aller au contenu principal
            </a>
            <SiteHeader />
            <main id="main" className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
