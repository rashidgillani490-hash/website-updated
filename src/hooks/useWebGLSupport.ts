"use client";

import { useEffect, useState } from "react";

/**
 * Probes for a usable WebGL context once on mount.
 * `null` while unknown (server + first client render), then `true` / `false`.
 * Callers should treat `null` as "not yet" and avoid mounting a <Canvas>.
 */
export function useWebGLSupport() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    let ok = false;
    try {
      const canvas = document.createElement("canvas");
      ok = Boolean(
        window.WebGLRenderingContext &&
          (canvas.getContext("webgl2") || canvas.getContext("webgl")),
      );
    } catch {
      ok = false;
    }
    setSupported(ok);
  }, []);

  return supported;
}
