"use client";

import { GalleryGrid } from "@/components/galleries/GalleryCard";
import { ToggleButton } from "@/components/common/ToggleButton";
import { Avatar, Empty, ErrorText, Loading } from "@/components/common/ui";
import type { ArtistProfile, Gallery } from "@/lib/api";
import { useAuth } from "@/stores/auth";
import { usePaged, useResource } from "@/lib/hooks";

export function ArtistProfileView({ username }: { username: string }) {
  const user = useAuth((s) => s.user);
  const profile = useResource<ArtistProfile>(`/users/${username}`);
  const galleries = usePaged<Gallery>(`/users/${username}/galleries`);

  if (profile.error) return <ErrorText>{profile.error}</ErrorText>;
  if (!profile.data) return <Loading />;
  const artist = profile.data;
  const isArtist = artist.role === "artist";

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center gap-5">
        <Avatar url={artist.avatar_url} name={artist.display_name} size={80} />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">{artist.display_name}</h1>
          <p className="text-subtle">
            @{artist.username}
            {isArtist && (
              <>
                {" "}
                · {artist.follower_count} {artist.follower_count === 1 ? "follower" : "followers"}
              </>
            )}
          </p>
          {artist.bio && <p className="mt-2 max-w-2xl whitespace-pre-line">{artist.bio}</p>}
        </div>
        {isArtist && user?.id !== artist.id && (
          <ToggleButton
            path={`/users/${artist.username}/follow`}
            active={artist.is_followed}
            labels={["Follow", "Following"]}
            onChange={(on) =>
              profile.setData({
                ...artist,
                is_followed: on,
                follower_count: artist.follower_count + (on ? 1 : -1),
              })
            }
          />
        )}
      </div>

      {isArtist && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Galleries</h2>
          {galleries.loading && galleries.items.length === 0 ? (
            <Loading />
          ) : galleries.items.length === 0 ? (
            <Empty>No galleries yet.</Empty>
          ) : (
            <GalleryGrid galleries={galleries.items} />
          )}
        </section>
      )}
    </>
  );
}
