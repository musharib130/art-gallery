"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RequireAuth } from "@/components/common/RequireAuth";
import { GalleryForm } from "@/components/studio/GalleryForm";
import { Button, ButtonLink, Empty, ErrorText, Loading, PageHeader } from "@/components/common/ui";
import { api, type Artwork, formatPrice, type Gallery, primaryImage, type UserMe } from "@/lib/api";
import { usePaged, useResource } from "@/lib/hooks";

function ManageGalleryContent({ user, id }: { user: UserMe; id: string }) {
  const router = useRouter();
  const gallery = useResource<Gallery>(`/galleries/${id}`);
  const artworks = usePaged<Artwork>(`/galleries/${id}/artworks`, 100);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (gallery.error) return <ErrorText>{gallery.error}</ErrorText>;
  if (!gallery.data) return <Loading />;
  if (gallery.data.owner.id !== user.id) return <Empty>You don&apos;t own this gallery.</Empty>;

  async function remove() {
    if (!confirm("Delete this gallery? This cannot be undone.")) return;
    try {
      await api.delete(`/galleries/${id}`);
      router.push("/studio");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Could not delete");
    }
  }

  return (
    <>
      <PageHeader
        title={gallery.data.title}
        subtitle={
          <Link href={`/galleries/${id}`} className="underline">
            View public page
          </Link>
        }
        actions={<ButtonLink href={`/studio/galleries/${id}/artworks/new`}>Add artwork</ButtonLink>}
      />

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold">Artworks</h2>
        {artworks.loading && artworks.items.length === 0 ? (
          <Loading />
        ) : artworks.items.length === 0 ? (
          <Empty>No artworks yet.</Empty>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {artworks.items.map((a) => (
              <li key={a.id}>
                <Link href={`/studio/artworks/${a.id}`} className="flex items-center gap-4 p-3 hover:bg-muted">
                  <img src={primaryImage(a)?.url} alt="" className="h-14 w-14 rounded-md object-cover" />
                  <span className="flex-1 font-medium">{a.title}</span>
                  <span className="text-sm text-subtle">
                    {a.is_for_sale && a.price_cents !== null
                      ? formatPrice(a.price_cents)
                      : a.price_cents !== null
                        ? `Not for sale (price ${formatPrice(a.price_cents)} hidden)`
                        : "Not for sale"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold">Details</h2>
        <GalleryForm
          initial={gallery.data}
          submitLabel="Save gallery"
          onSubmit={async (values) => {
            gallery.setData(await api.patch<Gallery>(`/galleries/${id}`, values));
          }}
        />
      </section>

      <section className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 className="text-lg font-semibold">Delete gallery</h2>
        <p className="text-sm text-subtle">A gallery can only be deleted once it has no artworks.</p>
        <ErrorText>{deleteError}</ErrorText>
        <div>
          <Button variant="danger" onClick={remove}>
            Delete gallery
          </Button>
        </div>
      </section>
    </>
  );
}

export function ManageGallery({ id }: { id: string }) {
  return <RequireAuth artist>{(user) => <ManageGalleryContent user={user} id={id} />}</RequireAuth>;
}
