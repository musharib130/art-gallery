"use client";

import { useRouter } from "next/navigation";

import { RequireAuth } from "@/components/common/RequireAuth";
import { GalleryForm } from "@/components/studio/GalleryForm";
import { PageHeader } from "@/components/common/ui";
import { api, type Gallery } from "@/lib/api";

export function NewGallery() {
  const router = useRouter();
  return (
    <RequireAuth artist>
      {() => (
        <>
          <PageHeader title="New gallery" />
          <GalleryForm
            submitLabel="Create gallery"
            onSubmit={async (values) => {
              const gallery = await api.post<Gallery>("/galleries", values);
              router.push(`/studio/galleries/${gallery.id}`);
            }}
          />
        </>
      )}
    </RequireAuth>
  );
}
