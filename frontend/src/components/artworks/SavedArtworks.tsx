"use client";

import { PagedArtworks } from "@/components/artworks/PagedArtworks";
import { RequireAuth } from "@/components/common/RequireAuth";
import { PageHeader } from "@/components/common/ui";

export function SavedArtworks() {
  return (
    <RequireAuth>
      {() => (
        <>
          <PageHeader title="Saved" subtitle="Artworks you've saved." />
          <PagedArtworks path="/me/saved" empty="You haven't saved any artworks yet." />
        </>
      )}
    </RequireAuth>
  );
}
