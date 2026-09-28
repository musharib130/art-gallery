"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/common/ui";
import { ArtworkForm } from "@/components/dashboard/ArtworkForm";
import { api, type Artwork } from "@/lib/api";

export function NewArtwork({ galleryId }: { galleryId: string }) {
  const router = useRouter();
  return (
    <>
      <PageHeader title="New artwork" />
      <ArtworkForm
        submitLabel="Create artwork"
        onSubmit={async (values) => {
          await api.post<Artwork>(`/galleries/${galleryId}/artworks`, values);
          router.push(`/dashboard/galleries/${galleryId}`);
        }}
      />
    </>
  );
}
