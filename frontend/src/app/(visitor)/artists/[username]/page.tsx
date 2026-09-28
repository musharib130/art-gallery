import { ArtistProfileView } from "@/components/artists/ArtistProfileView";

export default async function Page({ params }: PageProps<"/artists/[username]">) {
  const { username } = await params;
  return <ArtistProfileView username={username} />;
}
