"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { NavLink, SiteSettings } from "@/lib/content";
import { saveSettings } from "@/app/admin/actions";
import {
  Field,
  FieldGrid,
  FormSection,
  SubmitBar,
  TextArea,
  TextInput,
} from "./AdminForm";

interface SettingsFormProps {
  settings: SiteSettings;
}

const navToText = (links: NavLink[]) =>
  links.map((l) => `${l.label} | ${l.href}`).join("\n");

const textToNav = (text: string): NavLink[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split("|").map((p) => p.trim());
      return { label: label ?? "", href: href ?? "" };
    })
    .filter((l) => l.label && l.href);

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    brandName: settings.brandName,
    tagline: settings.tagline,
    description: settings.description,
    announcement: settings.announcement,
    logoUrl: settings.logoUrl ?? "",
    faviconUrl: settings.faviconUrl ?? "",
    heroHeadline: settings.heroHeadline ?? "",
    heroIntro: settings.heroIntro ?? "",
    homepageIntro: settings.homepageIntro ?? "",
    brandStory: settings.brandStory ?? "",
    contactEmail: settings.contactEmail,
    currency: settings.currency,
    address: settings.addressLines.join("\n"),
    primaryNav: navToText(settings.primaryNav),
    footerNav: navToText(settings.footerNav),
    social: navToText(settings.social),
  });

  const set = <K extends keyof typeof form>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaved(false);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);
    setFieldErrors({});
    startTransition(async () => {
      const result = await saveSettings({
        brandName: form.brandName,
        tagline: form.tagline,
        description: form.description,
        announcement: form.announcement,
        logoUrl: form.logoUrl,
        faviconUrl: form.faviconUrl,
        heroHeadline: form.heroHeadline,
        heroIntro: form.heroIntro,
        homepageIntro: form.homepageIntro,
        brandStory: form.brandStory,
        contactEmail: form.contactEmail,
        currency: form.currency,
        addressLines: form.address.split("\n").map((l) => l.trim()).filter(Boolean),
        primaryNav: textToNav(form.primaryNav),
        footerNav: textToNav(form.footerNav),
        social: textToNav(form.social),
      });
      if (result.ok) {
        setDirty(false);
        setSaved(true);
        router.refresh();
      } else if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        setError("Some fields need attention.");
      } else {
        setError(result.error ?? "That didn't save.");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      <FormSection
        title="Brand"
        description="The wordmark and the line that sits beneath it everywhere. Saved values drive the storefront."
      >
        <FieldGrid>
          <Field label="Website name" htmlFor="brandName" error={fieldErrors.brandName}>
            <TextInput
              id="brandName"
              value={form.brandName}
              onChange={(e) => set("brandName", e.target.value)}
            />
          </Field>
          <Field label="Tagline" htmlFor="tagline" error={fieldErrors.tagline}>
            <TextInput
              id="tagline"
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </Field>
        </FieldGrid>
        <Field
          label="Description"
          htmlFor="description"
          hint="Footer copy and page metadata."
          error={fieldErrors.description}
        >
          <TextArea
            id="description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
        <FieldGrid>
          <Field label="Logo URL" htmlFor="logoUrl" hint="Optional." error={fieldErrors.logoUrl}>
            <TextInput
              id="logoUrl"
              value={form.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Favicon URL" htmlFor="faviconUrl" hint="Optional." error={fieldErrors.faviconUrl}>
            <TextInput
              id="faviconUrl"
              value={form.faviconUrl}
              onChange={(e) => set("faviconUrl", e.target.value)}
              placeholder="https://…"
            />
          </Field>
        </FieldGrid>
      </FormSection>

      <FormSection
        title="Announcement bar"
        description="The thin line above the header. Leave empty to hide it."
      >
        <Field label="Announcement" htmlFor="announcement" error={fieldErrors.announcement}>
          <TextInput
            id="announcement"
            value={form.announcement}
            onChange={(e) => set("announcement", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Homepage copy"
        description="Drives the home page directly: the hero headline and intro, the house-section lead paragraph, and the collection lead-in."
      >
        <Field
          label="Hero headline"
          htmlFor="heroHeadline"
          hint="Each line becomes a separate clipped line in the hero."
          error={fieldErrors.heroHeadline}
        >
          <TextArea
            id="heroHeadline"
            className="min-h-24"
            value={form.heroHeadline}
            onChange={(e) => set("heroHeadline", e.target.value)}
          />
        </Field>
        <Field label="Hero intro" htmlFor="heroIntro" error={fieldErrors.heroIntro}>
          <TextArea
            id="heroIntro"
            value={form.heroIntro}
            onChange={(e) => set("heroIntro", e.target.value)}
          />
        </Field>
        <Field
          label="Homepage introduction"
          htmlFor="homepageIntro"
          hint="Lead paragraph under the house-section heading."
          error={fieldErrors.homepageIntro}
        >
          <TextArea
            id="homepageIntro"
            value={form.homepageIntro}
            onChange={(e) => set("homepageIntro", e.target.value)}
          />
        </Field>
        <Field
          label="Brand story"
          htmlFor="brandStory"
          hint="Intro line above the featured collection on the home page."
          error={fieldErrors.brandStory}
        >
          <TextArea
            id="brandStory"
            value={form.brandStory}
            onChange={(e) => set("brandStory", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Contact" description="Where enquiries go and the atelier address.">
        <FieldGrid>
          <Field label="Contact email" htmlFor="contactEmail" error={fieldErrors.contactEmail}>
            <TextInput
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
          </Field>
          <Field label="Currency" htmlFor="currency" hint="ISO code, e.g. USD." error={fieldErrors.currency}>
            <TextInput
              id="currency"
              value={form.currency}
              onChange={(e) => set("currency", e.target.value.toUpperCase())}
              maxLength={3}
            />
          </Field>
        </FieldGrid>
        <Field label="Address" htmlFor="address" hint="One line per row." error={fieldErrors.addressLines}>
          <TextArea
            id="address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Navigation"
        description={'One item per line, written as "Label | /href".'}
      >
        <Field label="Primary navigation" htmlFor="primaryNav">
          <TextArea
            id="primaryNav"
            className="min-h-32"
            value={form.primaryNav}
            onChange={(e) => set("primaryNav", e.target.value)}
          />
        </Field>
        <Field label="Footer navigation" htmlFor="footerNav">
          <TextArea
            id="footerNav"
            className="min-h-32"
            value={form.footerNav}
            onChange={(e) => set("footerNav", e.target.value)}
          />
        </Field>
        <Field label="Social links" htmlFor="social">
          <TextArea
            id="social"
            className="min-h-24"
            value={form.social}
            onChange={(e) => set("social", e.target.value)}
          />
        </Field>
      </FormSection>

      <SubmitBar
        pending={pending}
        dirty={dirty}
        saved={saved}
        error={error}
        actionLabel="Save settings"
      />
    </form>
  );
}
