"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/content";
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

export function SettingsForm({ settings }: SettingsFormProps) {
  const [form, setForm] = useState({
    brandName: settings.brandName,
    tagline: settings.tagline,
    description: settings.description,
    announcement: settings.announcement,
    contactEmail: settings.contactEmail,
    currency: settings.currency,
    address: settings.addressLines.join("\n"),
    primaryNav: settings.primaryNav
      .map((l) => `${l.label} | ${l.href}`)
      .join("\n"),
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col">
      <FormSection
        title="Brand"
        description="The wordmark and the line that sits beneath it everywhere."
      >
        <FieldGrid>
          <Field label="Brand name" htmlFor="brandName">
            <TextInput
              id="brandName"
              value={form.brandName}
              onChange={(e) => set("brandName", e.target.value)}
            />
          </Field>
          <Field label="Tagline" htmlFor="tagline">
            <TextInput
              id="tagline"
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </Field>
        </FieldGrid>
        <Field label="Description" htmlFor="description" hint="Used in the footer and page metadata.">
          <TextArea
            id="description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Announcement bar"
        description="The thin line above the header. Leave empty to hide it."
      >
        <Field label="Announcement" htmlFor="announcement">
          <TextInput
            id="announcement"
            value={form.announcement}
            onChange={(e) => set("announcement", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Contact"
        description="Where enquiries go and the atelier address."
      >
        <FieldGrid>
          <Field label="Contact email" htmlFor="contactEmail">
            <TextInput
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
          </Field>
          <Field label="Currency" htmlFor="currency" hint="ISO code, e.g. USD.">
            <TextInput
              id="currency"
              value={form.currency}
              onChange={(e) => set("currency", e.target.value.toUpperCase())}
            />
          </Field>
        </FieldGrid>
        <Field label="Address" htmlFor="address" hint="One line per row.">
          <TextArea
            id="address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Primary navigation"
        description="One item per line, written as “Label | /href”."
      >
        <Field label="Navigation items" htmlFor="primaryNav">
          <TextArea
            id="primaryNav"
            className="min-h-40 font-[var(--font-sans)]"
            value={form.primaryNav}
            onChange={(e) => set("primaryNav", e.target.value)}
          />
        </Field>
      </FormSection>

      <SubmitBar actionLabel="Save settings" />
    </form>
  );
}
