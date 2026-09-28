"use client";

import { useParams } from "next/navigation";

import { EditArtwork } from "@/components/dashboard/EditArtwork";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <EditArtwork id={id} />;
}
