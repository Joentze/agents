"use client";

import { Database } from "@/app/types/database.types";
import { Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type ArtifactFolder = Database["public"]["Tables"]["artifact_folder"]["Row"];

interface ArtifactFolderItemProps {
  folder: ArtifactFolder;
  dragOverId: string | null;
  draggingFolderId?: string | null;
  onDoubleClick: (id: string) => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: () => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, id: string) => void;
}

export function ArtifactFolderItem({
  folder,
  draggingFolderId,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: ArtifactFolderItemProps) {
  const [isBeingHovered, setIsBeingHovered] = useState(false);
  const isDragging = draggingFolderId === folder.id;

  return (
    <div
      key={folder.id}
      draggable={!!onDragStart}
      onDragStart={(e) => onDragStart?.(e, folder.id)}
      onDragEnd={onDragEnd}
      className={cn(
        "flex flex-row gap-2 bg-accent/50 rounded-lg p-2 hover:bg-accent/100 transition-all cursor-pointer border border-border ring-2 ring-border/50 focus-visible:ring-primary focus-visible:ring-2 px-3",
        isBeingHovered && "ring-primary ring-4 bg-accent/100 scale-105",
        isDragging && "opacity-50"
      )}
      onDoubleClick={() => onDoubleClick(folder.id)}
      onDragOver={(e) => {
        onDragOver(e, folder.id);
        setIsBeingHovered(true);
      }}
      onDragLeave={() => {
        onDragLeave();
        setIsBeingHovered(false);
      }}
      onDrop={(e) => {
        onDrop(e, folder.id);
        setIsBeingHovered(false);
      }}
    >
      {isBeingHovered ? (
        <FolderOpen className="size-4 text-muted-foreground my-auto" />
      ) : (
        <Folder className="size-4 text-muted-foreground my-auto" />
      )}
      <p className="truncate line-clamp-1 text-sm my-auto">{folder.name}</p>
    </div>
  );
}
