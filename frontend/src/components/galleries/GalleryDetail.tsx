"use client";

import Link from "next/link";

import { PagedArtworks } from "@/components/artworks/PagedArtworks";
import { ToggleButton } from "@/components/common/ToggleButton";
import { ButtonLink, ErrorText, Loading } from "@/components/common/ui";
import type { Gallery } from "@/lib/api";
import { useAuth } from "@/stores/auth";
import { useResource } from "@/lib/hooks";

export function GalleryDetail({ id }: { id: string }) {
  const user = useAuth((s) => s.user);
  const { data: gallery, setData, error } = useResource<Gallery>(`/galleries/${id}`);

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!gallery) return <Loading />;
  const isOwner = user?.id === gallery.owner.id;

  return (
    <>
      <div className="mb-10 grid gap-6 md:grid-cols-[2fr_3fr] md:items-end">
        <img src={gallery.cover_image_url} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{gallery.title}</h1>
          <p className="text-subtle">
            by{" "}
            <Link href={`/artists/${gallery.owner.username}`} className="underline">
              {gallery.owner.display_name}
            </Link>{" "}
            · {gallery.artwork_count} {gallery.artwork_count === 1 ? "artwork" : "artworks"} ·{" "}
            {gallery.follower_count} {gallery.follower_count === 1 ? "follower" : "followers"}
          </p>
          {gallery.description && <p className="whitespace-pre-line">{gallery.description}</p>}
          <div>
            {isOwner ? (
              <ButtonLink href={`/dashboard/galleries/${gallery.id}`} variant="secondary">
                Manage gallery
              </ButtonLink>
            ) : (
              <ToggleButton
                path={`/galleries/${gallery.id}/follow`}
                active={gallery.is_followed}
                labels={["Follow gallery", "Following"]}
                onChange={(on) =>
                  setData({
                    ...gallery,
                    is_followed: on,
                    follower_count: gallery.follower_count + (on ? 1 : -1),
                  })
                }
              />
            )}
          </div>
        </div>
      </div>
      <PagedArtworks path={`/galleries/${gallery.id}/artworks`} empty="This gallery has no artworks yet." />
    </>
  );
}
