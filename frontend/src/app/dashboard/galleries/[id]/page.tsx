"use client";

import { useParams } from "next/navigation";

import { ManageGallery } from "@/components/dashboard/ManageGallery";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <ManageGallery id={id} />;
}
