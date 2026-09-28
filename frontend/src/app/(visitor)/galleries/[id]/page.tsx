import { GalleryDetail } from "@/components/galleries/GalleryDetail";

export default async function Page({ params }: PageProps<"/galleries/[id]">) {
  const { id } = await params;
  return <GalleryDetail id={id} />;
}
