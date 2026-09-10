import { getAdminRepo } from "@/lib/admin/context";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const settings = await (await getAdminRepo()).getSettings();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow">Website settings</span>
        <h1 className="font-serif text-3xl font-light text-ivory">
          Brand &amp; storefront
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-ivory-dim">
          These values feed the header, footer, page metadata and homepage. The
          website name shown across the site is whatever you save here.
        </p>
      </header>
      <SettingsForm settings={settings} />
    </div>
  );
}
