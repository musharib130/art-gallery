import { ArtworkDetail } from "@/components/artworks/ArtworkDetail";

export default async function Page({ params }: PageProps<"/artworks/[id]">) {
  const { id } = await params;
  return <ArtworkDetail id={id} />;
}
