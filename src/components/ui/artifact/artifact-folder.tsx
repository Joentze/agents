"use client";

import { Database } from "@/app/types/database.types";
import { Folder, FolderOpen, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
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
  onRename,
  onDelete,
}: ArtifactFolderItemProps) {
  const [isBeingHovered, setIsBeingHovered] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState(folder.name);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const isDragging = draggingFolderId === folder.id;

  const handleRename = () => {
    if (newFolderName.trim() && newFolderName !== folder.name) {
      onRename?.(folder.id, newFolderName.trim());
    }
    setIsEditDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteConfirmation === folder.name) {
      onDelete?.(folder.id);
      setIsDeleteDialogOpen(false);
      setDeleteConfirmation("");
    }
  };

  const handleEditDialogOpen = () => {
    setNewFolderName(folder.name);
    setIsEditDialogOpen(true);
  };

  const handleDeleteDialogOpen = () => {
    setDeleteConfirmation("");
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
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
            <p className="truncate line-clamp-1 text-sm my-auto">
              {folder.name}
            </p>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={handleEditDialogOpen}>
            <Pencil className="size-4 mr-2" />
            Rename
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={handleDeleteDialogOpen}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="size-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for the folder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename();
                  }
                }}
                placeholder="Enter folder name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!newFolderName.trim() || newFolderName === folder.name}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              folder and all its contents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="delete-confirmation">
                Type{" "}
                <span className="font-semibold text-foreground">
                  {folder.name}
                </span>{" "}
                to confirm
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && deleteConfirmation === folder.name) {
                    handleDelete();
                  }
                }}
                placeholder="Enter folder name to confirm"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmation !== folder.name}
            >
              Delete Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
