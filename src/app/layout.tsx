import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Maayan Trans & Services | Premium Inter-City Taxi",
  description: "Experience premium inter-city travel with Maayan Trans & Services. Safe, reliable, and comfortable journeys with certified drivers and transparent pricing.",
  keywords: "intercity taxi, Coimbatore taxi, premium cab service, long distance travel, outstation cabs, Maayan Trans, reliable taxi",
  authors: [{ name: "Maayan Trans & Services" }],
  robots: "index, follow",
  openGraph: {
    title: "Maayan Trans & Services | Premium Inter-City Taxi",
    description: "Experience premium inter-city travel with Maayan Trans & Services. Certified drivers, comfortable fleet, and 24/7 support.",
    type: "website",
    locale: "en_IN",
    siteName: "Maayan Trans & Services",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${inter.variable}`}>
        <BookingProvider>
          <BackgroundOrbs />
          {children}
        </BookingProvider>
      </body>
    </html>
  );
}
