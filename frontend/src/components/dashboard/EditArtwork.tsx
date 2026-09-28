"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Empty, ErrorText, Loading, PageHeader } from "@/components/common/ui";
import { ArtworkForm, type ArtworkValues } from "@/components/dashboard/ArtworkForm";
import { useDashboardArtist } from "@/components/dashboard/DashboardLayout";
import { api, type Artwork } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { useArtworks } from "@/stores/artworks";

function sameImages(artwork: Artwork, values: ArtworkValues): boolean {
  const primary = artwork.images.findIndex((i) => i.is_primary);
  return (
    primary === values.primary_index &&
    artwork.images.length === values.images.length &&
    artwork.images.every((img, i) => img.url === values.images[i])
  );
}

export function EditArtwork({ id }: { id: string }) {
  const user = useDashboardArtist();
  const router = useRouter();
  const { data: artwork, setData, error } = useResource<Artwork>(`/artworks/${id}`);
  const upsert = useArtworks((s) => s.upsert);
  const removeCached = useArtworks((s) => s.remove);
  const [saved, setSaved] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!artwork) return <Loading />;
  if (artwork.artist.id !== user.id) return <Empty>You don&apos;t own this artwork.</Empty>;

  async function save(values: ArtworkValues) {
    if (!artwork) return;
    setSaved(false);
    // Send the price first so switching to "for sale" always has one.
    let updated = await api.patch<Artwork>(`/artworks/${id}`, {
      title: values.title,
      description: values.description,
      is_for_sale: values.is_for_sale,
      ...(values.price_cents !== null && { price_cents: values.price_cents }),
    });
    if (!sameImages(artwork, values)) {
      updated = await api.put<Artwork>(`/artworks/${id}/images`, {
        images: values.images,
        primary_index: values.primary_index,
      });
    }
    setData(updated);
    upsert([updated]);
    setSaved(true);
  }

  async function remove() {
    if (!artwork || !confirm("Delete this artwork? Its likes, saves and comments go with it.")) return;
    try {
      await api.delete(`/artworks/${id}`);
      removeCached(id);
      router.push(`/dashboard/galleries/${artwork.gallery.id}`);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Could not delete");
    }
  }

  return (
    <>
      <PageHeader
        title={`Edit “${artwork.title}”`}
        subtitle={
          <>
            In{" "}
            <Link href={`/dashboard/galleries/${artwork.gallery.id}`} className="underline">
              {artwork.gallery.title}
            </Link>{" "}
            ·{" "}
            <Link href={`/artworks/${id}`} className="underline">
              View public page
            </Link>
          </>
        }
      />
      <ArtworkForm key={artwork.updated_at} initial={artwork} submitLabel="Save artwork" onSubmit={save} />
      {saved && <p className="mt-3 text-sm text-subtle">Saved.</p>}

      <section className="mt-12 flex flex-col gap-3 border-t border-line pt-6">
        <h2 className="text-lg font-semibold">Delete artwork</h2>
        <ErrorText>{deleteError}</ErrorText>
        <div>
          <Button variant="danger" onClick={remove}>
            Delete artwork
          </Button>
        </div>
      </section>
    </>
  );
}
