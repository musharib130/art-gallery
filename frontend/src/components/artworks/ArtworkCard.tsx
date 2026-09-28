import Link from "next/link";

import { type Artwork, formatPrice, primaryImage } from "@/lib/api";

export function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const image = primaryImage(artwork);
  return (
    <Link href={`/artworks/${artwork.id}`} className="group flex flex-col gap-2">
      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
        {image && (
          <img
            src={image.url}
            alt={artwork.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{artwork.title}</p>
          <p className="truncate text-sm text-subtle">{artwork.artist.display_name}</p>
        </div>
        {artwork.is_for_sale && artwork.price_cents !== null && (
          <span className="shrink-0 text-sm font-medium">{formatPrice(artwork.price_cents)}</span>
        )}
      </div>
      <p className="text-xs text-subtle">
        {artwork.like_count} {artwork.like_count === 1 ? "like" : "likes"} · {artwork.comment_count}{" "}
        {artwork.comment_count === 1 ? "comment" : "comments"}
      </p>
    </Link>
  );
}

export function ArtworkGrid({ artworks }: { artworks: Artwork[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {artworks.map((a) => (
        <ArtworkCard key={a.id} artwork={a} />
      ))}
    </div>
  );
}
