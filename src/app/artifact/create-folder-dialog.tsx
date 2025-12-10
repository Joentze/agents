"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FolderPlus, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createArtifact,
  createArtifactFolder,
} from "@/app/actions/artifact-actions";
import { useRouter } from "next/navigation";
import { randomUUID } from "crypto";

interface CreateFolderDialogProps {
  parentFolderId?: string | null;
}

export function CreateFolderDialog({
  parentFolderId,
}: CreateFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState("Untitled Folder");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await createArtifactFolder({
        name: folderName,
        parent_folder_id: parentFolderId || null,
      });
      setOpen(false);
      setFolderName("Untitled Folder");
      router.refresh();
    } catch (error) {
      console.error("Error creating folder:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateNewArtifact = async () => {
    const artifact = await createArtifact({
      title: "Untitled",
      description: "Untitled",
      content: "Start writing your artifact here...",
    });
    if (artifact) {
      router.push(`/artifact/${artifact.id}`);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size={"icon"}
            className="border-border ring-2 ring-border/50 ml-auto my-auto rounded-full"
            variant={"secondary"}
          >
            <Plus />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCreateNewArtifact}>
            <Plus />
            New Artifact
          </DropdownMenuItem>
          <DialogTrigger asChild>
            <DropdownMenuItem>
              <FolderPlus />
              New Folder
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Folder Name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCreate();
            }
          }}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant={"ghost"} disabled={isCreating}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
