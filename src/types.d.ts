// Ambient module declarations for non-code imports.
//
// Next.js's bundled types declare `*.module.css` but not a plain, side-effecting
// `import "./globals.css"`. `tsc` and `next build` don't flag that (TypeScript
// skips unchecked side-effect imports by default), but editors running with
// `noUncheckedSideEffectImports` report TS2882. This keeps them quiet without
// changing the build.

declare module "*.css";
