import { ManageGallery } from "@/components/studio/ManageGallery";

export default async function Page({ params }: PageProps<"/studio/galleries/[id]">) {
  const { id } = await params;
  return <ManageGallery id={id} />;
}
