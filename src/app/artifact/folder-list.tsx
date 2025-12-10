"use client";

import { Database } from "@/app/types/database.types";
import { useRouter } from "next/navigation";
import {
  moveArtifactToFolder,
  moveFolderToFolder,
} from "@/app/actions/artifact-actions";
import { useState } from "react";
import { ArtifactFolderItem } from "@/components/ui/artifact/artifact-folder";

type ArtifactFolder = Database["public"]["Tables"]["artifact_folder"]["Row"];

interface FolderListProps {
  folders: ArtifactFolder[];
  parentFolderId?: string | null;
}

export function FolderList({ folders, parentFolderId }: FolderListProps) {
  const router = useRouter();
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);

  const handleFolderDragStart = (e: React.DragEvent, folderId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("folderId", folderId);
    setDraggingFolderId(folderId);
  };

  const handleFolderDragEnd = () => {
    setDraggingFolderId(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    setDragOverId(null);

    const artifactId = e.dataTransfer.getData("artifactId");
    const sourceFolderId = e.dataTransfer.getData("folderId");

    try {
      if (artifactId) {
        // Moving an artifact into a folder
        await moveArtifactToFolder(artifactId, targetFolderId);
      } else if (sourceFolderId && sourceFolderId !== targetFolderId) {
        // Moving a folder into another folder
        await moveFolderToFolder(sourceFolderId, targetFolderId);
      }
      // Refresh the page to update the lists
      router.refresh();
    } catch (error) {
      console.error("Failed to move item to folder:", error);
      // Optional: Show error toast message
    }
  };

  if (!folders || folders.length === 0) {
    return null;
  }

  const handleFolderDoubleClick = (folderId: string) => {
    router.push(`/artifact/folder/${folderId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-8 px-1 bg-background">
      {folders.map((folder) => (
        <ArtifactFolderItem
          key={folder.id}
          folder={folder}
          dragOverId={dragOverId}
          draggingFolderId={draggingFolderId}
          onDoubleClick={handleFolderDoubleClick}
          onDragStart={handleFolderDragStart}
          onDragEnd={handleFolderDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
