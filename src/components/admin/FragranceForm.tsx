"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FRAGRANCE_FAMILIES,
  type Perfume,
  type PerfumeAvailability,
} from "@/lib/content/types";
import { createPerfume, updatePerfume } from "@/app/admin/actions";
import {
  Checkbox,
  Field,
  FieldGrid,
  FormSection,
  SelectInput,
  SubmitBar,
  TextArea,
  TextInput,
} from "./AdminForm";
import { SizesEditor, type SizeRow } from "./SizesEditor";
import { NotesEditor, type NoteRow } from "./NotesEditor";

const AVAILABILITIES: PerfumeAvailability[] = [
  "available",
  "coming-soon",
  "sold-out",
  "archived",
];

interface FragranceFormProps {
  /** Existing record to edit, or undefined for a new fragrance. */
  perfume?: Perfume;
}

export function FragranceForm({ perfume }: FragranceFormProps) {
  const router = useRouter();
  const isEdit = Boolean(perfume);
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(!isEdit);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: perfume?.name ?? "",
    slug: perfume?.slug ?? "",
    concentration: perfume?.concentration ?? "Eau de Parfum",
    family: perfume?.family ?? "Floral",
    perfumer: perfume?.perfumer ?? "",
    year: String(perfume?.year ?? new Date().getFullYear()),
    accent: perfume?.accent ?? "#c7ac7c",
    tagline: perfume?.tagline ?? "",
    description: perfume?.description ?? "",
    availability: perfume?.availability ?? ("available" as PerfumeAvailability),
    featured: perfume?.featured ?? false,
    isPublished: perfume?.isPublished ?? true,
    displayOrder: String(perfume?.order ?? 0),
  });

  const [sizes, setSizes] = useState<SizeRow[]>(
    perfume?.sizes.length
      ? perfume.sizes.map((s) => ({ ml: String(s.ml), price: String(s.price) }))
      : [{ ml: "", price: "" }],
  );
  const [notes, setNotes] = useState<NoteRow[]>(
    perfume?.notes.map((n) => ({
      name: n.name,
      tier: n.tier,
      description: n.description ?? "",
    })) ?? [],
  );

  const touch = () => {
    setDirty(true);
    setSaved(false);
  };
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    touch();
  };

  const families = useMemo(() => [...FRAGRANCE_FAMILIES], []);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);
    setFieldErrors({});

    const payload = {
      perfume: {
        name: form.name,
        slug: form.slug,
        concentration: form.concentration,
        family: form.family,
        tagline: form.tagline,
        description: form.description,
        perfumer: form.perfumer,
        year: form.year,
        accent: form.accent,
        availability: form.availability,
        featured: form.featured,
        isPublished: form.isPublished,
        displayOrder: form.displayOrder,
      },
      sizes: sizes.map((s, i) => ({
        ml: s.ml,
        price: s.price,
        displayOrder: i,
      })),
      notes: notes.map((n, i) => ({
        name: n.name,
        tier: n.tier,
        description: n.description,
        displayOrder: i,
      })),
    };

    startTransition(async () => {
      const result = isEdit
        ? await updatePerfume(perfume!.id, payload)
        : await createPerfume(payload);
      // createPerfume redirects on success and never returns here.
      if (result.ok) {
        setDirty(false);
        setSaved(true);
        router.refresh();
      } else if (result.fieldErrors) {
        setFieldErrors(mapFieldErrors(result.fieldErrors));
        setError("Some fields need attention.");
      } else {
        setError(result.error ?? "That didn't save.");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      <FormSection
        title="Identity"
        description="Name, URL and how the fragrance is categorised."
      >
        <FieldGrid>
          <Field label="Name" htmlFor="name" error={fieldErrors["perfume.name"]}>
            <TextInput
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Lumière Noire"
            />
          </Field>
          <Field
            label="Slug"
            htmlFor="slug"
            hint="Lowercase, hyphen-separated. Used in the URL."
            error={fieldErrors["perfume.slug"]}
          >
            <TextInput
              id="slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="lumiere-noire"
            />
          </Field>
          <Field
            label="Concentration"
            htmlFor="concentration"
            error={fieldErrors["perfume.concentration"]}
          >
            <TextInput
              id="concentration"
              value={form.concentration}
              onChange={(e) => set("concentration", e.target.value)}
            />
          </Field>
          <Field label="Family" htmlFor="family" error={fieldErrors["perfume.family"]}>
            <SelectInput
              id="family"
              value={form.family}
              onChange={(e) =>
                set("family", e.target.value as typeof form.family)
              }
            >
              {families.map((f) => (
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
        description="Who composed it, when, and the accent hue for the 3D scene."
      >
        <FieldGrid>
          <Field label="Perfumer" htmlFor="perfumer" error={fieldErrors["perfume.perfumer"]}>
            <TextInput
              id="perfumer"
              value={form.perfumer}
              onChange={(e) => set("perfumer", e.target.value)}
            />
          </Field>
          <Field label="Year" htmlFor="year" error={fieldErrors["perfume.year"]}>
            <TextInput
              id="year"
              inputMode="numeric"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
            />
          </Field>
          <Field
            label="Accent colour"
            htmlFor="accent"
            hint="Tints the 3D flacon and card details."
            error={fieldErrors["perfume.accent"]}
          >
            <div className="flex items-center gap-3">
              <input
                aria-label="Accent colour picker"
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(form.accent) ? form.accent : "#c7ac7c"}
                onChange={(e) => set("accent", e.target.value)}
                className="h-11 w-14 cursor-pointer border border-line bg-ink-800"
              />
              <TextInput
                id="accent"
                value={form.accent}
                onChange={(e) => set("accent", e.target.value)}
              />
            </div>
          </Field>
        </FieldGrid>
      </FormSection>

      <FormSection
        title="Copy"
        description="The one-line tagline and the long-form composition story."
      >
        <Field label="Tagline" htmlFor="tagline" error={fieldErrors["perfume.tagline"]}>
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
          error={fieldErrors["perfume.description"]}
        >
          <TextArea
            id="description"
            className="min-h-40"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Sizes" description="At least one. Row order is the display order.">
        <SizesEditor
          value={sizes}
          onChange={(rows) => {
            setSizes(rows);
            touch();
          }}
          error={fieldErrors["sizes"]}
        />
      </FormSection>

      <FormSection title="Fragrance notes" description="Top, heart and base.">
        <NotesEditor
          value={notes}
          onChange={(rows) => {
            setNotes(rows);
            touch();
          }}
          error={fieldErrors["notes"]}
        />
      </FormSection>

      <FormSection
        title="Visibility"
        description="Publishing controls whether the storefront can see this fragrance."
      >
        <FieldGrid>
          <Field label="Availability" htmlFor="availability">
            <SelectInput
              id="availability"
              value={form.availability}
              onChange={(e) =>
                set("availability", e.target.value as PerfumeAvailability)
              }
            >
              {AVAILABILITIES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field
            label="Display order"
            htmlFor="displayOrder"
            hint="Lower shows first."
            error={fieldErrors["perfume.displayOrder"]}
          >
            <TextInput
              id="displayOrder"
              inputMode="numeric"
              value={form.displayOrder}
              onChange={(e) => set("displayOrder", e.target.value)}
            />
          </Field>
        </FieldGrid>
        <div className="flex flex-col gap-1">
          <Checkbox
            label="Published (visible on the storefront)"
            checked={form.isPublished}
            onChange={(e) => set("isPublished", e.target.checked)}
          />
          <Checkbox
            label="Featured on the home page"
            checked={form.featured}
            onChange={(e) => set("featured", e.target.checked)}
          />
        </div>
      </FormSection>

      {!isEdit ? (
        <p className="mt-4 text-xs text-smoke">
          Save the fragrance to add hero and gallery images.
        </p>
      ) : null}

      <SubmitBar
        pending={pending}
        dirty={dirty}
        saved={saved}
        error={error}
        actionLabel={isEdit ? "Save fragrance" : "Create fragrance"}
      />
    </form>
  );
}

/**
 * Server field-error keys are nested (`perfume.name`, `sizes.0.ml`). Collapse
 * array-index keys down to the section (`sizes.0.ml` -> `sizes`) so the editor
 * shows one message.
 */
function mapFieldErrors(errors: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, message] of Object.entries(errors)) {
    const normalized = key.replace(/^(sizes|notes)\..*/, "$1");
    if (!out[normalized]) out[normalized] = message;
    if (!out[key]) out[key] = message;
  }
  return out;
}
