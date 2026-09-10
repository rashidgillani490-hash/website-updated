/**
 * Configuration for <CinematicPerfumeExperience />.
 *
 * The component is a scroll-driven story, not a mouse-driven 3D viewer. Scroll
 * progress (0 → 1 across the track) drives four beats — revolve, open, spray,
 * settle — and reveals a sequence of text chapters over the top. Both the home
 * page and individual fragrance pages build a config here and reuse the same
 * component; only these numbers and copy change.
 */

export interface CinematicSubject {
  /** Fragrance name, shown in the closing chapter and used for a11y labels. */
  name: string;
  /** Dominant hue; tints the glass, the liquid and the spray. Hex. */
  accent: string;
  /** Atmospheric still shown behind the scene and as the non-3D fallback. */
  poster: string;
  posterAlt: string;
}

export type ChapterKind = "hero" | "beat" | "brand";

export interface CinematicChapter {
  id: string;
  /** Progress window [start, end] (0..1) in which this chapter is on screen. */
  at: [number, number];
  eyebrow?: string;
  title: string;
  body?: string;
  kind?: ChapterKind;
}

/** Each pair is a [start, end] progress window for that beat. */
export interface CinematicBeats {
  /** Bottle turns a full 360°. */
  revolve: [number, number];
  /** Cap lifts clear of the neck. */
  open: [number, number];
  /** Fragrance is released from the nozzle. */
  spray: [number, number];
  /** Scene recedes and dissolves as the brand copy takes over. */
  settle: [number, number];
}

export interface CinematicConfig {
  /** Scroll track height as a multiple of the viewport height. */
  track: number;
  beats: CinematicBeats;
  chapters: CinematicChapter[];
}

interface HomeCopy {
  eyebrow: string;
  heroTitle: string;
  heroBody: string;
  brandEyebrow: string;
}

/** Full story used on the home page. */
export function buildHomeCinematic(copy: HomeCopy): CinematicConfig {
  return {
    track: 4.6,
    beats: {
      revolve: [0.04, 0.46],
      open: [0.44, 0.64],
      spray: [0.6, 0.86],
      settle: [0.86, 1],
    },
    chapters: [
      {
        id: "hero",
        kind: "hero",
        at: [0, 0.1],
        eyebrow: copy.eyebrow,
        title: copy.heroTitle,
        body: copy.heroBody,
      },
      {
        id: "revolve",
        kind: "beat",
        at: [0.14, 0.34],
        title: "Worn close",
        body: "Composed for the few inches of air around you — never for the room.",
      },
      {
        id: "open",
        kind: "beat",
        at: [0.4, 0.58],
        title: "Unstoppered",
        body: "The cap lifts. Nothing now stands between the composition and the air.",
      },
      {
        id: "spray",
        kind: "beat",
        at: [0.62, 0.8],
        title: "One accord, released",
        body: "A single idea, sprayed and left to open on its own time.",
      },
      {
        id: "brand",
        kind: "brand",
        at: [0.88, 1],
        eyebrow: copy.brandEyebrow,
        title: "Maison Lumière",
        body: "A small Parisian house making auteur perfumes — each one signed, made in limited batches, and left exactly as it was composed.",
      },
    ],
  };
}

/** Shorter, quieter version for a fragrance detail page. */
export function buildProductCinematic(name: string): CinematicConfig {
  return {
    track: 3,
    beats: {
      revolve: [0.02, 0.5],
      open: [0.46, 0.7],
      spray: [0.66, 0.92],
      settle: [0.95, 1],
    },
    chapters: [
      {
        id: "revolve",
        kind: "beat",
        at: [0.02, 0.3],
        eyebrow: "In the round",
        title: name,
        body: "Turn the flacon through a full revolution.",
      },
      {
        id: "open",
        kind: "beat",
        at: [0.42, 0.62],
        title: "Unstoppered",
        body: "The cap lifts clear of the neck.",
      },
      {
        id: "spray",
        kind: "beat",
        at: [0.68, 0.9],
        title: "Released",
        body: "The composition, sprayed into the air.",
      },
    ],
  };
}
