import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { contentRepository } from "@/lib/content";
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
  return {
    metadataBase: new URL("https://maisonlumiere.example"),
    title: {
      default: `${settings.brandName} — ${settings.tagline}`,
      template: `%s — ${settings.brandName}`,
    },
    description: settings.description,
    openGraph: {
      title: settings.brandName,
      description: settings.description,
      type: "website",
    },
    ...(favicon ? { icons: { icon: favicon } } : {}),
    robots: { index: true, follow: true },
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
