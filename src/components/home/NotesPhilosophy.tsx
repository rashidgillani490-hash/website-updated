import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

const FAMILIES = [
  { name: "Floral", note: "White flowers held in restraint" },
  { name: "Amber", note: "Resins warmed slowly" },
  { name: "Woody", note: "Dry cedar, a curl of smoke" },
  { name: "Chypre", note: "Mineral, bitter, moving" },
  { name: "Leather", note: "Suede without the smoke" },
  { name: "Citrus", note: "Brightness with an anchor" },
];

export function NotesPhilosophy() {
  return (
    <section id="notes" className="border-y border-line/60 bg-ink-800 py-28 md:py-36">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionHeading
            eyebrow="On notes"
            title="We build around a single idea"
            intro="Each fragrance starts from one accord and refuses to crowd it. What you smell at the top is still there at the base — quieter, changed, but never abandoned."
          />

          <ul className="grid grid-cols-1 gap-px self-start overflow-hidden border border-line bg-line sm:grid-cols-2">
            {FAMILIES.map((family, i) => (
              <Reveal as="li" key={family.name} delay={(i % 2) * 0.05}>
                <div className="flex h-full flex-col gap-2 bg-ink-800 p-7">
                  <span className="font-serif text-xl text-ivory">{family.name}</span>
                  <span className="text-sm leading-snug text-ivory-dim">
                    {family.note}
                  </span>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
