"use client";

import { GalleryGrid } from "@/components/galleries/GalleryCard";
import { RequireAuth } from "@/components/common/RequireAuth";
import { ButtonLink, Empty, Loading, PageHeader } from "@/components/common/ui";
import type { Gallery, UserMe } from "@/lib/api";
import { usePaged } from "@/lib/hooks";

function Studio({ user }: { user: UserMe }) {
  const { items, loading } = usePaged<Gallery>(`/users/${user.username}/galleries`, 100);
  return (
    <>
      <PageHeader
        title="Studio"
        subtitle="Manage your galleries and artworks."
        actions={<ButtonLink href="/studio/galleries/new">New gallery</ButtonLink>}
      />
      {loading && items.length === 0 ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty>You haven&apos;t created a gallery yet. Start one to add artworks.</Empty>
      ) : (
        <GalleryGrid galleries={items} hrefFor={(g) => `/studio/galleries/${g.id}`} />
      )}
    </>
  );
}

export function StudioHome() {
  return <RequireAuth artist>{(user) => <Studio user={user} />}</RequireAuth>;
}
