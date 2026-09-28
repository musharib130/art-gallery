"use client";

import { ButtonLink, Empty, Loading, PageHeader } from "@/components/common/ui";
import { useDashboardArtist } from "@/components/dashboard/DashboardLayout";
import { GalleryGrid } from "@/components/galleries/GalleryCard";
import type { Gallery } from "@/lib/api";
import { usePaged } from "@/lib/hooks";

export function DashboardHome() {
  const artist = useDashboardArtist();
  const { items, loading } = usePaged<Gallery>(`/users/${artist.username}/galleries`, 100);
  return (
    <>
      <PageHeader
        title="Your galleries"
        subtitle="Manage your galleries and artworks."
        actions={<ButtonLink href="/dashboard/galleries/new">New gallery</ButtonLink>}
      />
      {loading && items.length === 0 ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty>You haven&apos;t created a gallery yet. Start one to add artworks.</Empty>
      ) : (
        <GalleryGrid galleries={items} hrefFor={(g) => `/dashboard/galleries/${g.id}`} />
      )}
    </>
  );
}
