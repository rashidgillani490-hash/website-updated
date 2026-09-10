import { contentRepository } from "@/lib/content";
import { CartProvider } from "@/components/cart/CartProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await contentRepository.getSettings();

  return (
    <CartProvider currency={settings.currency}>
      <div className="flex min-h-svh flex-col">
        <Header settings={settings} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
      </div>
    </CartProvider>
  );
}
