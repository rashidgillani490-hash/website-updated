import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";

interface InvitationProps {
  email: string;
}

/** Closing editorial panel before the footer. */
export function Invitation({ email }: InvitationProps) {
  return (
    <section id="contact" className="relative overflow-hidden bg-ink py-32 md:py-44">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.5] [background-image:url('/images/grain.svg')]"
      />
      <Container className="relative flex flex-col items-center text-center">
        <Reveal>
          <span className="eyebrow">Visit the atelier</span>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="mt-7 max-w-2xl font-serif text-[clamp(1.9rem,4.5vw,3rem)] font-light leading-[1.15] text-ivory">
            Fragrance is best chosen on skin. Write to us, or come to the Marais
            and take your time.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
            <ButtonLink href={`mailto:${email}`} variant="solid">
              Write to the atelier
            </ButtonLink>
            <ButtonLink href="/collection" variant="ghost">
              Browse the collection
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
