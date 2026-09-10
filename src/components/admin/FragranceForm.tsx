"use client";

import { useState } from "react";
import type { Perfume, FragranceFamily } from "@/lib/content";
import {
  Field,
  FieldGrid,
  FormSection,
  SelectInput,
  SubmitBar,
  TextArea,
  TextInput,
} from "./AdminForm";
import { ImageUpload } from "./ImageUpload";

const FAMILIES: FragranceFamily[] = [
  "Floral",
  "Woody",
  "Amber",
  "Chypre",
  "Citrus",
  "Leather",
  "Aromatic",
];

interface FragranceFormProps {
  /** Existing record to edit, or undefined for a new fragrance. */
  perfume?: Perfume;
}

export function FragranceForm({ perfume }: FragranceFormProps) {
  const [form, setForm] = useState({
    name: perfume?.name ?? "",
    slug: perfume?.slug ?? "",
    concentration: perfume?.concentration ?? "Eau de Parfum",
    family: perfume?.family ?? "Floral",
    perfumer: perfume?.perfumer ?? "",
    year: perfume?.year ?? new Date().getFullYear(),
    accent: perfume?.accent ?? "#c7ac7c",
    tagline: perfume?.tagline ?? "",
    description: perfume?.description ?? "",
    featured: perfume?.featured ?? false,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col">
      <FormSection
        title="Identity"
        description="Name, URL and how the fragrance is categorised in the collection."
      >
        <FieldGrid>
          <Field label="Name" htmlFor="name">
            <TextInput
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Lumière Noire"
            />
          </Field>
          <Field label="Slug" htmlFor="slug" hint="Used in the fragrance URL.">
            <TextInput
              id="slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="lumiere-noire"
            />
          </Field>
          <Field label="Concentration" htmlFor="concentration">
            <TextInput
              id="concentration"
              value={form.concentration}
              onChange={(e) => set("concentration", e.target.value)}
            />
          </Field>
          <Field label="Family" htmlFor="family">
            <SelectInput
              id="family"
              value={form.family}
              onChange={(e) => set("family", e.target.value as FragranceFamily)}
            >
              {FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </SelectInput>
          </Field>
        </FieldGrid>
      </FormSection>

      <FormSection
        title="Attribution"
        description="Who composed it and when. Shown on the fragrance page."
      >
        <FieldGrid>
          <Field label="Perfumer" htmlFor="perfumer">
            <TextInput
              id="perfumer"
              value={form.perfumer}
              onChange={(e) => set("perfumer", e.target.value)}
            />
          </Field>
          <Field label="Year" htmlFor="year">
            <TextInput
              id="year"
              type="number"
              value={form.year}
              onChange={(e) => set("year", Number(e.target.value))}
            />
          </Field>
          <Field
            label="Accent colour"
            htmlFor="accent"
            hint="Tints the 3D scene and card details."
          >
            <div className="flex items-center gap-3">
              <input
                id="accent"
                type="color"
                value={form.accent}
                onChange={(e) => set("accent", e.target.value)}
                className="h-11 w-14 cursor-pointer border border-line bg-ink-800"
              />
              <TextInput
                value={form.accent}
                onChange={(e) => set("accent", e.target.value)}
              />
            </div>
          </Field>
          <Field label="Featured" htmlFor="featured" hint="Show on the home page.">
            <label className="flex h-11 items-center gap-3 text-sm text-ivory-dim">
              <input
                id="featured"
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 accent-champagne"
              />
              Include in the featured selection
            </label>
          </Field>
        </FieldGrid>
      </FormSection>

      <FormSection
        title="Copy"
        description="The one-line tagline and the long-form composition story."
      >
        <Field label="Tagline" htmlFor="tagline">
          <TextInput
            id="tagline"
            value={form.tagline}
            onChange={(e) => set("tagline", e.target.value)}
          />
        </Field>
        <Field
          label="Description"
          htmlFor="description"
          hint="Separate paragraphs with a blank line."
        >
          <TextArea
            id="description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Imagery"
        description="The atmospheric hero and the bottle shot used across the site."
      >
        <ImageUpload
          label="Hero image"
          currentSrc={perfume?.hero.src}
          currentAlt={perfume?.hero.alt}
        />
        <ImageUpload
          label="Bottle image"
          currentSrc={perfume?.gallery[0]?.src}
          currentAlt={perfume?.gallery[0]?.alt}
        />
      </FormSection>

      <SubmitBar actionLabel={perfume ? "Save fragrance" : "Create fragrance"} />
    </form>
  );
}
