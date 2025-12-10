import { getArtifact } from "@/app/actions/artifact-actions";
import ArtifactProvider from "./artifact-provider";

export default async function ArtifactLayout({
  children,
  params,
}: {
  params: Promise<{ artifactId: string }>;
  children: React.ReactNode;
}) {
  const { artifactId } = await params;
  const artifact = await getArtifact(artifactId);
  return (
    <ArtifactProvider artifact={artifact}>
      <div className="w-full flex flex-col">{children}</div>
    </ArtifactProvider>
  );
}
