"use client";

import Link from "next/link";

import { Avatar, Button, Empty, ErrorText, Loading, PageHeader } from "@/components/common/ui";
import type { ArtistProfile } from "@/lib/api";
import { usePaged } from "@/lib/hooks";

export function ArtistList() {
  const { items, hasMore, loading, error, loadMore } = usePaged<ArtistProfile>("/artists", 24);

  return (
    <>
      <PageHeader title="Artists" />
      {error ? (
        <ErrorText>{error}</ErrorText>
      ) : loading && items.length === 0 ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty>No artists yet.</Empty>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Link
              key={a.id}
              href={`/artists/${a.username}`}
              className="flex items-center gap-3 rounded-lg border border-line p-4 hover:bg-muted"
            >
              <Avatar url={a.avatar_url} name={a.display_name} size={48} />
              <div className="min-w-0">
                <p className="truncate font-medium">{a.display_name}</p>
                <p className="text-sm text-subtle">
                  {a.gallery_count} {a.gallery_count === 1 ? "gallery" : "galleries"} · {a.follower_count}{" "}
                  {a.follower_count === 1 ? "follower" : "followers"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
      {hasMore && (
        <div className="mt-8 text-center">
          <Button variant="secondary" onClick={loadMore} disabled={loading}>
            Load more
          </Button>
        </div>
      )}
    </>
  );
}
