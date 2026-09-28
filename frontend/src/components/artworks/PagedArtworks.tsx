"use client";

import { useEffect } from "react";

import { ArtworkGrid } from "@/components/artworks/ArtworkCard";
import { Button, Empty, ErrorText, Loading } from "@/components/common/ui";
import type { Artwork } from "@/lib/api";
import { usePaged } from "@/lib/hooks";
import { useArtworks } from "@/stores/artworks";

export function PagedArtworks({ path, empty }: { path: string; empty: React.ReactNode }) {
  const { items, hasMore, loading, error, loadMore } = usePaged<Artwork>(path);
  const upsert = useArtworks((s) => s.upsert);
  const byId = useArtworks((s) => s.byId);

  // Fresh server data refreshes the shared cache...
  useEffect(() => upsert(items), [items, upsert]);
  // ...and cards render the cached copy, so changes made elsewhere show up here.
  const artworks = items.map((a) => byId[a.id] ?? a);

  if (error) return <ErrorText>{error}</ErrorText>;
  if (loading && items.length === 0) return <Loading />;
  if (artworks.length === 0) return <Empty>{empty}</Empty>;

  return (
    <div className="flex flex-col gap-8">
      <ArtworkGrid artworks={artworks} />
      {hasMore && (
        <div className="text-center">
          <Button variant="secondary" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
