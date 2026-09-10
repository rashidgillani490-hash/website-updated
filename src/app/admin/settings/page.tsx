import { contentRepository } from "@/lib/content";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const settings = await contentRepository.getSettings();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow">Site settings</span>
        <h1 className="font-serif text-3xl font-light text-ivory">
          Brand &amp; storefront
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-ivory-dim">
          These values feed the header, footer and page metadata across the site.
        </p>
      </header>
      <SettingsForm settings={settings} />
    </div>
  );
}
