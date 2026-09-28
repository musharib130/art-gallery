"use client";

import { GalleryGrid } from "@/components/galleries/GalleryCard";
import { PagedArtworks } from "@/components/artworks/PagedArtworks";
import { Button, PageHeader } from "@/components/common/ui";
import type { Gallery } from "@/lib/api";
import { usePaged } from "@/lib/hooks";

export function ExploreView() {
  const galleries = usePaged<Gallery>("/galleries", 6);
  return (
    <>
      <PageHeader title="Explore" subtitle="Every gallery and artwork, newest first." />
      {galleries.items.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold">Galleries</h2>
          <GalleryGrid galleries={galleries.items} />
          {galleries.hasMore && (
            <div className="mt-6 text-center">
              <Button variant="secondary" onClick={galleries.loadMore} disabled={galleries.loading}>
                More galleries
              </Button>
            </div>
          )}
        </section>
      )}
      <h2 className="mb-4 text-lg font-semibold">Artworks</h2>
      <PagedArtworks path="/explore" empty="No artworks have been published yet." />
    </>
  );
}
