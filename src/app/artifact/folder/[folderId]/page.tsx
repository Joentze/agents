import { Folder, Feather } from "lucide-react";
import {
  getArtifactFolder,
  getArtifactsInFolder,
  getArtifactFolders,
  getFolderPath,
} from "@/app/actions/artifact-actions";
import { ArtifactList } from "../../artifact-list";
import { FolderList } from "../../folder-list";
import { CreateFolderDialog } from "../../create-folder-dialog";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenuContent,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function FolderPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = await params;
  const folder = await getArtifactFolder(folderId);
  const { data: artifacts, count } = await getArtifactsInFolder(folderId, 1, 9);
  const subfolders = await getArtifactFolders(folderId);
  const folderPath = await getFolderPath(folderId);
  return (
    <div className="w-full md:w-2/3 mx-auto">
      <div className="top-0 z-10 sticky">
        <div className="flex flex-row h-32 border-b border-border bg-background">
          <div className="flex flex-col my-auto gap-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/artifact" className="text-lg">
                      Artifacts
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {folderPath.length > 1 && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-1">
                          <BreadcrumbEllipsis className="size-4" />
                          <span className="sr-only">Toggle menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {folderPath
                            .filter((folder) => folder.id !== folderId)
                            .map((folder) => (
                              <DropdownMenuItem key={folder.id} asChild>
                                <Link href={`/artifact/folder/${folder.id}`}>
                                  {folder.name}
                                </Link>
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </BreadcrumbItem>
                  </>
                )}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-2 text-lg">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    {folder.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <CreateFolderDialog parentFolderId={folderId} />
        </div>

        {subfolders && subfolders.length > 0 && (
          <FolderList folders={subfolders} parentFolderId={folderId} />
        )}

        <div className="w-full h-10 bg-gradient-to-b from-background to-transparent"></div>
      </div>
      {!artifacts || artifacts.length === 0 ? (
        <div className="w-full h-96 border outline-dashed outline-border border-none rounded-lg p-4 flex flex-col justify-center items-center gap-2 text-muted-foreground ">
          <Feather className="w-8 h-8" />
          <p className="text-sm text-subtext w-1/3 text-center">
            This folder is empty. Drag and drop artifacts or folders here to
            organize them.
          </p>
        </div>
      ) : (
        <ArtifactList
          initialArtifacts={artifacts}
          totalCount={count || 0}
          folderId={folderId}
        />
      )}
    </div>
  );
}
