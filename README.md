# Maison Lumière

A premium 3D perfume storefront. Phase 1 lays the foundation: brand system,
component architecture, a swappable content layer, the interactive 3D flacon,
scroll-driven motion, and a visual Admin scaffold.

## Stack

- **Next.js 15** (App Router, TypeScript, static generation)
- **Tailwind CSS 4** (CSS-first tokens in `src/app/globals.css`)
- **React Three Fiber / three.js** — procedural flacon, local studio lighting
- **Framer Motion** — hero line reveals, scroll-linked story section

## Scripts

```bash
npm run dev        # local development
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## Architecture

```
src/
  app/
    (site)/            storefront routes — share Header + Footer
      page.tsx         home: Hero · ScrollStory · FeaturedCollection · NotesPhilosophy · Invitation
      collection/      full catalogue grid
      fragrance/[slug] product detail (SSG from repository slugs)
    admin/             Admin scaffold — own shell, noindex
      fragrances/      list · [id] edit · new
      settings/        site settings form
  components/
    layout/            Header, Navigation, MobileMenu, Footer
    home/              Hero, ScrollStory (scroll-driven), FeaturedCollection, NotesPhilosophy, Invitation
    perfume/           PerfumeCard, PerfumeCollection, FragranceNotes, PerfumeDetail
    three/             PerfumeExperience (Canvas + poster fallback), PerfumeBottle, SceneEnvironment
    admin/             AdminShell, AdminNav, AdminForm primitives, ImageUpload, FragranceForm, SettingsForm
    ui/                Container, Button, Reveal, SectionHeading
  lib/
    content/           the data layer — see below
    motion/            shared Framer Motion variants + house easing
    utils.ts           cn(), formatPrice(), toParagraphs()
  hooks/               useScrolled()
```

### Content layer (`src/lib/content`)

Every storefront and Admin screen reads through **`contentRepository`**
(`repository.ts`), an async interface. Today it resolves from typed mock data
(`perfumes.ts`, `settings.ts`); a later phase backs the same interface with a
database or CMS and populates it from the Admin write path — no consumer
changes, because nothing imports the mock arrays directly.

- `types.ts` — `Perfume`, `FragranceNote`, `SiteSettings`, …
- `repository.ts` — `ContentRepository` interface + `MockContentRepository`
- swap the final `export const contentRepository = …` to change the source

### Admin (Phase 1 scope)

Screens, navigation and fully controlled forms are in place. Persistence,
image upload storage and authentication are intentionally **not** implemented —
`SubmitBar` is disabled and `ImageUpload` previews locally only.

## Assets

Placeholder artwork in `public/images/` is generated SVG (atmosphere fields and
flacon silhouettes per fragrance). Replace with photography via the Admin image
fields in a later phase.
