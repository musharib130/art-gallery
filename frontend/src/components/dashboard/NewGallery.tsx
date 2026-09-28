"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/common/ui";
import { GalleryForm } from "@/components/dashboard/GalleryForm";
import { api, type Gallery } from "@/lib/api";

export function NewGallery() {
  const router = useRouter();
  return (
    <>
      <PageHeader title="New gallery" />
      <GalleryForm
        submitLabel="Create gallery"
        onSubmit={async (values) => {
          const gallery = await api.post<Gallery>("/galleries", values);
          router.push(`/dashboard/galleries/${gallery.id}`);
        }}
      />
    </>
  );
}
