"use client";

import { useRouter } from "next/navigation";

import { RequireAuth } from "@/components/common/RequireAuth";
import { ArtworkForm } from "@/components/studio/ArtworkForm";
import { PageHeader } from "@/components/common/ui";
import { api, type Artwork } from "@/lib/api";

export function NewArtwork({ galleryId }: { galleryId: string }) {
  const router = useRouter();
  return (
    <RequireAuth artist>
      {() => (
        <>
          <PageHeader title="New artwork" />
          <ArtworkForm
            submitLabel="Create artwork"
            onSubmit={async (values) => {
              await api.post<Artwork>(`/galleries/${galleryId}/artworks`, values);
              router.push(`/studio/galleries/${galleryId}`);
            }}
          />
        </>
      )}
    </RequireAuth>
  );
}
