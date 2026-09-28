import Link from "next/link";

import type { Gallery } from "@/lib/api";

export function GalleryCard({ gallery, href }: { gallery: Gallery; href?: string }) {
  return (
    <Link href={href ?? `/galleries/${gallery.id}`} className="group flex flex-col gap-2">
      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        <img
          src={gallery.cover_image_url}
          alt={gallery.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div>
        <p className="font-medium">{gallery.title}</p>
        <p className="text-sm text-subtle">
          by {gallery.owner.display_name} · {gallery.artwork_count}{" "}
          {gallery.artwork_count === 1 ? "artwork" : "artworks"}
        </p>
      </div>
    </Link>
  );
}

export function GalleryGrid({ galleries, hrefFor }: { galleries: Gallery[]; hrefFor?: (g: Gallery) => string }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {galleries.map((g) => (
        <GalleryCard key={g.id} gallery={g} href={hrefFor?.(g)} />
      ))}
    </div>
  );
}
