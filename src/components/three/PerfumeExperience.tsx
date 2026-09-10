"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useReducedMotion, type MotionValue } from "motion/react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { cn } from "@/lib/utils";
import { CanvasErrorBoundary } from "./CanvasErrorBoundary";
import { qualityFor } from "./quality";

/**
 * The WebGL layer is split into its own chunk and only fetched on the client.
 * `ssr: false` keeps three.js / drei out of the server bundle entirely.
 */
const PerfumeCanvas = dynamic(() => import("./PerfumeCanvas"), { ssr: false });

type StoryMode = "cinematic" | "showcase";

interface PerfumeExperienceProps {
  accent?: string;
  /** Shown while the scene compiles, when WebGL is unavailable, and on error. */
  poster: string;
  posterAlt: string;
  className?: string;
  priorityPoster?: boolean;
  /**
   * Scroll progress (0..1) of a surrounding story track. When supplied the
   * flacon is scroll-driven; `story` picks the choreography. Passing only a
   * `MotionValue` keeps three.js out of the caller's bundle — this component
   * forwards it untouched to the lazy canvas chunk.
   */
  scrollProgress?: MotionValue<number>;
  story?: StoryMode;
}

/**
 * The interactive centrepiece — a procedural flacon on a studio floor that
 * turns slowly and leans toward the cursor.
 *
 * Performance model:
 *  - The heavy canvas chunk is lazy (`next/dynamic`, `ssr: false`) and only
 *    mounts once the scene has come within 256px of the viewport.
 *  - Once mounted it stays mounted (no WebGL-context churn), but its render
 *    loop idles whenever the scene is off-screen or the tab is hidden.
 *  - `frameloop="demand"` — see PerfumeCanvas.
 *  - Constrained devices get a lighter profile (see quality.ts).
 *  - `prefers-reduced-motion` holds a static pose.
 *
 * There is a single fallback — the poster image — used for the not-yet-loaded,
 * no-WebGL, and canvas-error cases alike. The rest of the page is unaffected
 * in every one of them.
 *
 * The pointer is held in a ref and mutated in place; the render loop reads it
 * each frame, so cursor tracking never triggers a React re-render.
 */
export function PerfumeExperience({
  accent = "#c7ac7c",
  poster,
  posterAlt,
  className,
  priorityPoster = false,
  scrollProgress,
  story,
}: PerfumeExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const [approached, setApproached] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [canvasFailed, setCanvasFailed] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  const webgl = useWebGLSupport(); // null | true | false
  const reducedMotion = useReducedMotion() ?? false;
  const isMobile = useMediaQuery("(max-width: 768px)");
  const quality = qualityFor(isMobile);

  // Approach + on-screen detection. `approached` latches on so the canvas is
  // not torn down when scrolled past; `inView` gates the render loop.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setApproached(true);
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setApproached(true);
      },
      { rootMargin: "256px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pause when the tab is backgrounded; resume when it returns.
  useEffect(() => {
    const sync = () => setPageVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion) return;
      const rect = event.currentTarget.getBoundingClientRect();
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    },
    [reducedMotion],
  );

  const resetPointer = useCallback(() => {
    pointer.current.x = 0;
    pointer.current.y = 0;
  }, []);

  const webglOk = webgl === true;
  const mountCanvas = webglOk && approached && !canvasFailed;
  const active = mountCanvas && inView && pageVisible;
  const showPoster = !webglOk || canvasFailed || !canvasReady;

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <Image
        src={poster}
        alt={posterAlt}
        fill
        priority={priorityPoster}
        sizes="(max-width: 1024px) 100vw, 55vw"
        className={cn(
          "object-cover transition-opacity duration-1000",
          showPoster ? "opacity-100" : "opacity-0",
        )}
      />

      {mountCanvas ? (
        <CanvasErrorBoundary onError={() => setCanvasFailed(true)}>
          <PerfumeCanvas
            accent={accent}
            pointer={pointer.current}
            active={active}
            reducedMotion={reducedMotion}
            quality={quality}
            onCreated={() => setCanvasReady(true)}
            scrollProgress={scrollProgress}
            story={story}
          />
        </CanvasErrorBoundary>
      ) : null}
    </div>
  );
}
