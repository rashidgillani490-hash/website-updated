import type { Perfume } from "./types";

/**
 * Mock catalogue. Realistic in shape and tone so the storefront looks finished;
 * a later phase replaces this array with Admin-managed records without the
 * storefront noticing (everything reads through the repository).
 */
export const PERFUMES: Perfume[] = [
  {
    id: "prf_lumiere_noire",
    slug: "lumiere-noire",
    name: "Lumière Noire",
    concentration: "Extrait de Parfum",
    family: "Amber",
    tagline: "Amber and incense held in a low, unhurried glow.",
    description: `Lumière Noire begins where the evening turns inward. Labdanum and benzoin are warmed slowly, then drawn back by a thread of frankincense so the sweetness never settles into comfort.

Worn close to the skin it reads as candlelight in a dark room — present, deliberate, impossible to place until you are near.`,
    perfumer: "Élodie Rançon",
    year: 2021,
    notes: [
      { name: "Pink Pepper", tier: "top", description: "a dry spark struck at the opening" },
      { name: "Saffron", tier: "top", description: "leathered, faintly medicinal warmth" },
      { name: "Labdanum", tier: "heart", description: "resinous amber, the spine of the scent" },
      { name: "Frankincense", tier: "heart", description: "cool smoke that keeps the amber honest" },
      { name: "Benzoin", tier: "base", description: "vanillic resin, soft and slow" },
      { name: "Vetiver", tier: "base", description: "a shadow of earth beneath" },
    ],
    sizes: [
      { ml: 50, price: 245 },
      { ml: 100, price: 365 },
    ],
    hero: { src: "/images/noire-atmosphere.svg", alt: "Amber light diffused through darkness" },
    gallery: [
      { src: "/images/noire-bottle.svg", alt: "Lumière Noire flacon, front view" },
      { src: "/images/noire-atmosphere.svg", alt: "Warm amber atmosphere" },
    ],
    accent: "#b98a4b",
    featured: true,
    order: 1,
  },
  {
    id: "prf_fleur_dombre",
    slug: "fleur-dombre",
    name: "Fleur d'Ombre",
    concentration: "Eau de Parfum",
    family: "Floral",
    tagline: "Tuberose in half-light, cooled by iris and clean musk.",
    description: `A white flower composition built for restraint. Tuberose and jasmine are given room to breathe, then shaded with orris butter until the effect is powdery rather than heady.

The drydown is quiet skin musk — the flowers recede but never quite leave.`,
    perfumer: "Marc Vaugelas",
    year: 2019,
    notes: [
      { name: "Green Mandarin", tier: "top", description: "a cold citrus edge" },
      { name: "Pear Blossom", tier: "top", description: "watery, translucent" },
      { name: "Tuberose", tier: "heart", description: "creamy, narcotic, held in check" },
      { name: "Orris Butter", tier: "heart", description: "silver, powdery, expensive" },
      { name: "White Musk", tier: "base", description: "laundered warmth" },
      { name: "Sandalwood", tier: "base", description: "a soft milky floor" },
    ],
    sizes: [
      { ml: 30, price: 135 },
      { ml: 50, price: 195 },
      { ml: 100, price: 285 },
    ],
    hero: { src: "/images/fleur-atmosphere.svg", alt: "Soft rose-grey light" },
    gallery: [
      { src: "/images/fleur-bottle.svg", alt: "Fleur d'Ombre flacon, front view" },
      { src: "/images/fleur-atmosphere.svg", alt: "Rose-grey atmosphere" },
    ],
    accent: "#c98f9b",
    featured: true,
    order: 2,
  },
  {
    id: "prf_bois_cendre",
    slug: "bois-cendre",
    name: "Bois Cendré",
    concentration: "Eau de Parfum",
    family: "Woody",
    tagline: "Dry cedar and a curl of woodsmoke over warm paper.",
    description: `Bois Cendré is the smell of a room the morning after a fire has burned down. Cedar and guaiac wood carry a soft ash note, kept from going grey by a little tonka.

It sits on the skin as texture more than sweetness — matte, sober, and long.`,
    perfumer: "Élodie Rançon",
    year: 2022,
    notes: [
      { name: "Cypress", tier: "top", description: "cold, coniferous, clarifying" },
      { name: "Cardamom", tier: "top", description: "a dry aromatic lift" },
      { name: "Cedar", tier: "heart", description: "sharpened pencil shavings" },
      { name: "Guaiac Wood", tier: "heart", description: "the smoke, tarry and warm" },
      { name: "Tonka Bean", tier: "base", description: "hay-like, just off sweet" },
      { name: "Cashmeran", tier: "base", description: "a soft woody haze" },
    ],
    sizes: [
      { ml: 50, price: 185 },
      { ml: 100, price: 265 },
    ],
    hero: { src: "/images/bois-atmosphere.svg", alt: "Ashen brown light" },
    gallery: [
      { src: "/images/bois-bottle.svg", alt: "Bois Cendré flacon, front view" },
      { src: "/images/bois-atmosphere.svg", alt: "Ashen wood atmosphere" },
    ],
    accent: "#9a7b5a",
    featured: true,
    order: 3,
  },
  {
    id: "prf_sel_iris",
    slug: "sel-et-iris",
    name: "Sel & Iris",
    concentration: "Eau de Parfum",
    family: "Chypre",
    tagline: "Mineral salt air pulled across cold, earthy orris.",
    description: `A modern chypre without the oakmoss weight. Iris root gives the grey, ambrette gives the skin, and a saline accord keeps the whole thing moving like wind off water.

Bright at a distance, quietly bitter up close.`,
    perfumer: "Naomi Feldt",
    year: 2020,
    notes: [
      { name: "Bergamot", tier: "top", description: "clean, faceted citrus" },
      { name: "Sea Salt Accord", tier: "top", description: "mineral, almost cold" },
      { name: "Orris Root", tier: "heart", description: "carrot-earth, rooty, grey" },
      { name: "Ambrette Seed", tier: "heart", description: "musky, pear-skin softness" },
      { name: "Patchouli", tier: "base", description: "a dry, cleaned-up base" },
      { name: "Ambergris Accord", tier: "base", description: "warm salt on skin" },
    ],
    sizes: [
      { ml: 50, price: 205 },
      { ml: 100, price: 295 },
    ],
    hero: { src: "/images/iris-atmosphere.svg", alt: "Cold blue-grey light" },
    gallery: [
      { src: "/images/iris-bottle.svg", alt: "Sel & Iris flacon, front view" },
      { src: "/images/iris-atmosphere.svg", alt: "Blue-grey atmosphere" },
    ],
    accent: "#8fa39b",
    featured: false,
    order: 4,
  },
  {
    id: "prf_cuir_blanc",
    slug: "cuir-blanc",
    name: "Cuir Blanc",
    concentration: "Extrait de Parfum",
    family: "Leather",
    tagline: "A pale, suede-soft leather brushed with orange flower.",
    description: `Leather without the smoke. A birch-free suede accord is lifted with neroli and a little beeswax, so it stays close to the colour of unfinished hide.

Refined, slightly austere, and unmistakably a signature.`,
    perfumer: "Marc Vaugelas",
    year: 2018,
    notes: [
      { name: "Neroli", tier: "top", description: "green, honeyed orange flower" },
      { name: "Aldehydes", tier: "top", description: "a lifted, soapy shimmer" },
      { name: "Suede Accord", tier: "heart", description: "matte, powdery leather" },
      { name: "Orange Flower Absolute", tier: "heart", description: "indolic warmth" },
      { name: "Beeswax", tier: "base", description: "waxy, faintly sweet" },
      { name: "Tonka Bean", tier: "base", description: "a soft almond floor" },
    ],
    sizes: [
      { ml: 50, price: 265 },
      { ml: 100, price: 385 },
    ],
    hero: { src: "/images/cuir-atmosphere.svg", alt: "Warm champagne light" },
    gallery: [
      { src: "/images/cuir-bottle.svg", alt: "Cuir Blanc flacon, front view" },
      { src: "/images/cuir-atmosphere.svg", alt: "Champagne atmosphere" },
    ],
    accent: "#c7ac7c",
    featured: false,
    order: 5,
  },
  {
    id: "prf_zeste_celeste",
    slug: "zeste-celeste",
    name: "Zeste Céleste",
    concentration: "Eau de Toilette",
    family: "Citrus",
    tagline: "Cold-pressed citron and petitgrain over pale musk.",
    description: `A citrus built to last longer than citrus usually does. Citron and grapefruit are anchored with petitgrain and a whisper of vetiver, so the brightness has something to hold onto.

Morning-clean, but never sharp.`,
    perfumer: "Naomi Feldt",
    year: 2023,
    notes: [
      { name: "Citron", tier: "top", description: "zesty, bittersweet peel" },
      { name: "Pink Grapefruit", tier: "top", description: "juicy, faintly sulphurous" },
      { name: "Petitgrain", tier: "heart", description: "green bitter-orange twig" },
      { name: "Neroli", tier: "heart", description: "a soft floral bridge" },
      { name: "Vetiver", tier: "base", description: "a thin rooty anchor" },
      { name: "White Musk", tier: "base", description: "clean, weightless" },
    ],
    sizes: [
      { ml: 50, price: 145 },
      { ml: 100, price: 210 },
    ],
    hero: { src: "/images/zeste-atmosphere.svg", alt: "Pale gold light" },
    gallery: [
      { src: "/images/zeste-bottle.svg", alt: "Zeste Céleste flacon, front view" },
      { src: "/images/zeste-atmosphere.svg", alt: "Pale gold atmosphere" },
    ],
    accent: "#d9c07a",
    featured: false,
    order: 6,
  },
];
