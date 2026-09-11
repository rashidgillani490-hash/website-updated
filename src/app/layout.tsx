import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { contentRepository } from "@/lib/content";
import { getSiteUrl } from "@/lib/seo";
import { MotionProvider } from "@/components/providers/MotionProvider";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await contentRepository.getSettings();
  const favicon = settings.faviconUrl?.trim();
  const title = `${settings.brandName} — ${settings.tagline}`;

  return {
    // Resolved from the runtime SITE_URL env var (or Vercel's production URL),
    // localhost until set — no domain is hardcoded. Makes every relative OG
    // image / canonical absolute.
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: title,
      template: `%s — ${settings.brandName}`,
    },
    description: settings.description,
    applicationName: settings.brandName,
    openGraph: {
      type: "website",
      siteName: settings.brandName,
      title,
      description: settings.description,
      url: "/",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: settings.description,
    },
    ...(favicon ? { icons: { icon: favicon } } : {}),
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-svh antialiased">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
