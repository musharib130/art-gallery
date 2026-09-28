"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ToggleButton } from "@/components/common/ToggleButton";
import { ButtonLink, ErrorText, Loading } from "@/components/common/ui";
import { type Artwork, formatPrice, primaryImage } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { useArtwork, useArtworks } from "@/stores/artworks";
import { useAuth } from "@/stores/auth";

import { Comments } from "./Comments";

export function ArtworkDetail({ id }: { id: string }) {
  const user = useAuth((s) => s.user);
  const { data, error } = useResource<Artwork>(`/artworks/${id}`);
  const upsert = useArtworks((s) => s.upsert);
  const patch = useArtworks((s) => s.patch);
  const artwork = useArtwork(id, data);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (data) upsert([data]);
  }, [data, upsert]);

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!artwork) return <Loading />;

  const isOwner = user?.id === artwork.artist.id;
  const selected = artwork.images.find((i) => i.id === selectedId) ?? primaryImage(artwork);
  // Writes go to the shared store, so feed/saved cards update too.
  const update = (changes: Partial<Artwork>) => patch(artwork.id, changes);

  return (
    <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-lg bg-muted">
          {selected && <img src={selected.url} alt={artwork.title} className="max-h-[75vh] w-full object-contain" />}
        </div>
        {artwork.images.length > 1 && (
          <div className="flex gap-2">
            {artwork.images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedId(img.id)}
                className={`h-16 w-16 overflow-hidden rounded-md ${img.id === selected?.id ? "ring-2 ring-foreground" : "opacity-70 hover:opacity-100"}`}
                aria-label={`Show image ${img.position + 1}`}
              >
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{artwork.title}</h1>
          <p className="mt-1 text-subtle">
            by{" "}
            <Link href={`/artists/${artwork.artist.username}`} className="underline">
              {artwork.artist.display_name}
            </Link>{" "}
            in{" "}
            <Link href={`/galleries/${artwork.gallery.id}`} className="underline">
              {artwork.gallery.title}
            </Link>
          </p>
        </div>

        <div className="text-xl font-medium">
          {artwork.is_for_sale && artwork.price_cents !== null ? (
            formatPrice(artwork.price_cents)
          ) : (
            <span className="text-base text-subtle">Not for sale</span>
          )}
        </div>

        {artwork.description && <p className="whitespace-pre-line">{artwork.description}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <ToggleButton
            path={`/artworks/${artwork.id}/like`}
            active={artwork.liked_by_me}
            labels={["Like", "Liked"]}
            onChange={(on) =>
              update({ liked_by_me: on, like_count: artwork.like_count + (on ? 1 : -1) })
            }
          />
          <ToggleButton
            path={`/artworks/${artwork.id}/save`}
            active={artwork.saved_by_me}
            labels={["Save", "Saved"]}
            onChange={(on) => update({ saved_by_me: on })}
          />
          <span className="text-sm text-subtle">
            {artwork.like_count} {artwork.like_count === 1 ? "like" : "likes"}
          </span>
          {isOwner && (
            <span className="ml-auto">
              <ButtonLink href={`/dashboard/artworks/${artwork.id}`} variant="secondary">
                Edit artwork
              </ButtonLink>
            </span>
          )}
        </div>

        <Comments
          artworkId={artwork.id}
          artworkOwnerId={artwork.artist.id}
          onCountChange={(delta) => update({ comment_count: artwork.comment_count + delta })}
        />
      </div>
    </div>
  );
}
