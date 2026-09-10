import type { ContentRepository } from "./types";
import { MockContentRepository } from "./mock-repository";
import { SupabaseContentRepository } from "./supabase-repository";
import { getPublicSupabaseClient } from "@/lib/supabase/client";

/**
 * The storefront's single content entry point.
 *
 *   UI → contentRepository (ContentRepository) → Mock | Supabase → data source
 *
 * Supabase is used when the public env vars are set; otherwise the sample data
 * in `MockContentRepository` is served so the site — and the test suite — run
 * with no backend. Swapping sources touches only this file; no component
 * imports a concrete implementation.
 */
function createContentRepository(): ContentRepository {
  const supabase = getPublicSupabaseClient();
  if (!supabase) {
    return new MockContentRepository();
  }
  return new SupabaseContentRepository(supabase, new MockContentRepository());
}

export const contentRepository: ContentRepository = createContentRepository();
