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
        url: "/photos/photo1.jpg",
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
    images: ["/photos/photo1.jpg"],
  },
  icons: {
    icon: "/logo6sombre_favicon.svg",
    shortcut: "/logo6sombre_favicon.svg",
    apple: "/logo6sombre_favicon.svg",
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
  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${poppins.className} antialiased`} suppressHydrationWarning>
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
