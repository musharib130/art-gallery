import { EditArtwork } from "@/components/studio/EditArtwork";

export default async function Page({ params }: PageProps<"/studio/artworks/[id]">) {
  const { id } = await params;
  return <EditArtwork id={id} />;
}
