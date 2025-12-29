import { Separator } from "@/components/ui/separator";
import { Feather } from "lucide-react";
import {
  getArtifacts,
  getArtifactFolders,
} from "@/app/actions/artifact-actions";
import { ArtifactList } from "./artifact-list";
import { FolderList } from "./folder-list";
import { CreateFolderDialog } from "./create-folder-dialog";

export default async function ArtifactPage() {
  const page = 1;
  const limit = 9;
  const { data: artifacts, count } = await getArtifacts(page, limit);
  const folders = await getArtifactFolders(null); // Get only top-level folders

  return (
    <div className="w-full md:w-2/3 mx-auto">
      <div className="top-0 z-10 sticky ">
        <div className="flex flex-row h-32 border-b border-border bg-background">
          <h1 className="text-3xl my-auto">Artifacts</h1>
          <CreateFolderDialog />
        </div>

        <FolderList folders={folders} parentFolderId={null} />
        <div className="w-full h-10 bg-gradient-to-b from-background to-transparent"></div>
      </div>

      {!artifacts || artifacts.length === 0 ? (
        <div className="w-full h-96 border outline-dashed outline-border border-none rounded-lg p-4 flex flex-col justify-center items-center gap-2 text-muted-foreground ">
          <Feather className="w-8 h-8" />
          <p className="text-sm text-subtext w-1/3 text-center">
            Seems like you don't have any artifacts yet. click 'New Artifact' to
            create one.
          </p>
        </div>
      ) : (
        <ArtifactList initialArtifacts={artifacts} totalCount={count || 0} />
      )}
    </div>
  );
}
