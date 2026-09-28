import { create } from "zustand";

import type { Artwork } from "@/lib/api";

/**
 * Shared artwork cache keyed by id. Every view that shows an artwork reads it
 * from here, so a like/save/edit made in one place shows up everywhere.
 */
interface ArtworkState {
  byId: Record<string, Artwork>;
  upsert: (artworks: Artwork[]) => void;
  patch: (id: string, changes: Partial<Artwork>) => void;
  remove: (id: string) => void;
}

export const useArtworks = create<ArtworkState>()((set) => ({
  byId: {},

  upsert: (artworks) =>
    set((state) => {
      // Returning the same state skips the update, so subscribers don't re-render.
      const changed = artworks.filter((a) => state.byId[a.id] !== a);
      if (changed.length === 0) return state;
      return { byId: { ...state.byId, ...Object.fromEntries(changed.map((a) => [a.id, a])) } };
    }),

  patch: (id, changes) =>
    set((state) => {
      const current = state.byId[id];
      return current ? { byId: { ...state.byId, [id]: { ...current, ...changes } } } : state;
    }),

  remove: (id) =>
    set((state) => {
      const byId = { ...state.byId };
      delete byId[id];
      return { byId };
    }),
}));

/** The cached copy of an artwork, falling back to the given one. */
export function useArtwork(id: string | undefined, fallback?: Artwork | null): Artwork | null {
  const cached = useArtworks((s) => (id ? s.byId[id] : undefined));
  return cached ?? fallback ?? null;
}
