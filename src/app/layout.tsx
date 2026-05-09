import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { AuthProvider } from "@/contexts/AuthContext";
import { BUSINESS_LEGAL_NAME, BUSINESS_NAME, BUSINESS_ADDRESS, BUSINESS_CITY, BUSINESS_POSTAL_CODE, BUSINESS_REGION, BUSINESS_COUNTRY, BUSINESS_PHONE, CONTACT_EMAIL, SITE_URL } from '@/lib/constants';
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
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
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
    "@id": `${SITE_URL}/#organization`,
    name: BUSINESS_NAME,
    legalName: BUSINESS_LEGAL_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo6sombre.png`,
    email: CONTACT_EMAIL,
    telephone: BUSINESS_PHONE,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS_ADDRESS,
      addressLocality: BUSINESS_CITY,
      postalCode: BUSINESS_POSTAL_CODE,
      addressRegion: BUSINESS_REGION,
      addressCountry: BUSINESS_COUNTRY,
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "Théranice",
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: SITE_URL,
      },
    ],
  };

  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${poppins.className} antialiased`} suppressHydrationWarning>
        <Script id="organization-jsonld" type="application/ld+json">
          {JSON.stringify(organizationJsonLd)}
        </Script>
        <Script id="website-jsonld" type="application/ld+json">
          {JSON.stringify(websiteJsonLd)}
        </Script>
        <Script id="breadcrumb-jsonld" type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </Script>
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
