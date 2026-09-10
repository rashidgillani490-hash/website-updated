"use client";

import { useEffect, useState } from "react";

/**
 * Reactive `matchMedia`. Returns false on the server and until mounted, then
 * tracks the query — including across viewport resizes and orientation changes.
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
}
