"use client";

import Link from "next/link";

import { PagedArtworks } from "@/components/artworks/PagedArtworks";
import { PageHeader } from "@/components/common/ui";
import { useAuth } from "@/stores/auth";

export function FeedView() {
  const user = useAuth((s) => s.user);
  return (
    <>
      <PageHeader
        title="Feed"
        subtitle={
          user
            ? "New work from the artists and galleries you follow. Follow nobody yet? You'll see everything."
            : "The latest artworks from every artist."
        }
      />
      <PagedArtworks
        path="/feed"
        empty={
          <>
            Nothing here yet. Browse <Link href="/artists" className="underline">artists</Link> to find
            work you like.
          </>
        }
      />
    </>
  );
}
