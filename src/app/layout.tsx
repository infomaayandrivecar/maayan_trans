import type { Metadata, Viewport } from "next";
import { Manrope, Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { BookingProvider } from "./context/BookingContext";
import BackgroundOrbs from "./components/BackgroundOrbs";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Premium brand wordmark typeface. Montserrat delivers a bold, confident, luxury mobility identity
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  // Lets Next resolve the relative OG image path to an absolute URL, which
  // social platforms require. Matches the base URL used by sitemap.ts/robots.ts.
  metadataBase: new URL("https://maayantransports.com"),
  title: "Maayan Trans & Services | Premium Inter-City Cab",
  description: "Experience premium inter-city travel with Maayan Trans & Services. Safe, reliable, and comfortable journeys with certified drivers and transparent pricing.",
  keywords: "intercity taxi, Coimbatore taxi, premium cab service, long distance travel, outstation cabs, Maayan Trans, reliable taxi",
  authors: [{ name: "Maayan Trans & Services" }],
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  openGraph: {
    title: "Maayan Trans & Services | Premium Inter-City Cab",
    description: "Experience premium inter-city travel with Maayan Trans & Services. Certified drivers, comfortable fleet, and 24/7 support.",
    type: "website",
    locale: "en_IN",
    siteName: "Maayan Trans & Services",
    images: [
      {
        url: "/og-mark.png",
        width: 512,
        height: 512,
        alt: "Maayan Trans & Services logo",
      }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${inter.variable} ${montserrat.variable}`}>
        <BookingProvider>
          <BackgroundOrbs />
          {children}
        </BookingProvider>
      </body>
    </html>
  );
}
