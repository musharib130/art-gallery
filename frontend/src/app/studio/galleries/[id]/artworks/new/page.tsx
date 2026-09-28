import { NewArtwork } from "@/components/studio/NewArtwork";

export default async function Page({ params }: PageProps<"/studio/galleries/[id]/artworks/new">) {
  const { id } = await params;
  return <NewArtwork galleryId={id} />;
}
