"use client";

import {
  getArtifacts,
  getArtifactsInFolder,
  updateArtifact,
  deleteArtifact,
} from "@/app/actions/artifact-actions";
import { Database } from "@/app/types/database.types";
import { Loader } from "@/components/ai-elements/loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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
import { Pencil, Trash2 } from "lucide-react";

type Artifact = Database["public"]["Tables"]["artifact"]["Row"];

interface ArtifactListProps {
  initialArtifacts: Artifact[];
  totalCount: number;
  folderId?: string;
}

export function ArtifactList({
  initialArtifacts,
  totalCount,
  folderId,
}: ArtifactListProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>(initialArtifacts);
  const [page, setPage] = useState(2);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialArtifacts.length < totalCount);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Dialog states
  const [editingArtifact, setEditingArtifact] = useState<Artifact | null>(null);
  const [deletingArtifact, setDeletingArtifact] = useState<Artifact | null>(
    null
  );
  const [newTitle, setNewTitle] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Sync state when initialArtifacts changes (after router.refresh())
  useEffect(() => {
    setArtifacts(initialArtifacts);
    setHasMore(initialArtifacts.length < totalCount);
    setPage(2);
  }, [initialArtifacts, totalCount]);

  const handleDragStart = (e: React.DragEvent, artifactId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("artifactId", artifactId);
    setDraggingId(artifactId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const limit = 9;
      const { data, count } = folderId
        ? await getArtifactsInFolder(folderId, page, limit)
        : await getArtifacts(page, limit);

      if (data) {
        setArtifacts((prev) => [...prev, ...data]);
        setPage((prev) => prev + 1);

        if (count !== null && artifacts.length + data.length >= count) {
          setHasMore(false);
        }

        // If we received fewer items than requested, we've reached the end
        if (data.length < limit) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error loading more artifacts:", error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, artifacts.length, folderId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMore]);

  const handleRename = async () => {
    if (!editingArtifact || !newTitle.trim()) return;

    const originalArtifacts = [...artifacts];

    // Optimistically update
    setArtifacts((prev) =>
      prev.map((a) =>
        a.id === editingArtifact.id ? { ...a, title: newTitle.trim() } : a
      )
    );
    setEditingArtifact(null);

    try {
      await updateArtifact(editingArtifact.id, { title: newTitle.trim() });
    } catch (error) {
      console.error("Failed to rename artifact:", error);
      // Revert on error
      setArtifacts(originalArtifacts);
    }
  };

  const handleDelete = async () => {
    if (!deletingArtifact || deleteConfirmation !== deletingArtifact.title)
      return;

    const originalArtifacts = [...artifacts];

    // Optimistically remove
    setArtifacts((prev) => prev.filter((a) => a.id !== deletingArtifact.id));
    setDeletingArtifact(null);
    setDeleteConfirmation("");

    try {
      await deleteArtifact(deletingArtifact.id);
    } catch (error) {
      console.error("Failed to delete artifact:", error);
      // Revert on error
      setArtifacts(originalArtifacts);
    }
  };

  const openEditDialog = (artifact: Artifact) => {
    setEditingArtifact(artifact);
    setNewTitle(artifact.title);
  };

  const openDeleteDialog = (artifact: Artifact) => {
    setDeletingArtifact(artifact);
    setDeleteConfirmation("");
  };

  return (
    <div className="">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 px-1">
        {artifacts.map((artifact) => (
          <ContextMenu key={artifact.id}>
            <ContextMenuTrigger asChild>
              <Card
                draggable
                onDragStart={(e) => handleDragStart(e, artifact.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex flex-col h-full cursor-pointer transition-opacity h-64",
                  draggingId === artifact.id && "opacity-50"
                )}
                onDoubleClick={() => {
                  router.push(`/artifact/${artifact.id}`);
                }}
              >
                <CardHeader>
                  <CardTitle className="truncate">{artifact.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {artifact.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-4 font-serif">
                    {artifact.content.slice(0, 100)}...
                  </p>
                </CardContent>
              </Card>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={() => openEditDialog(artifact)}>
                <Pencil className="size-4 mr-2" />
                Rename
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => openDeleteDialog(artifact)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="size-4 mr-2" />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>

      {hasMore && (
        <div
          ref={observerTarget}
          className="flex justify-center items-center w-full p-4 mt-4"
        >
          {loading && <Loader className="w-6 h-6 animate-spin" />}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingArtifact}
        onOpenChange={(open) => !open && setEditingArtifact(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Artifact</DialogTitle>
            <DialogDescription>
              Enter a new title for the artifact.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="artifact-title">Title</Label>
              <Input
                id="artifact-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename();
                  }
                }}
                placeholder="Enter artifact title"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingArtifact(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!newTitle.trim() || newTitle === editingArtifact?.title}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingArtifact}
        onOpenChange={(open) => !open && setDeletingArtifact(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Artifact</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              artifact.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="delete-confirmation">
                Type{" "}
                <span className="font-semibold text-foreground">
                  {deletingArtifact?.title}
                </span>{" "}
                to confirm
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    deleteConfirmation === deletingArtifact?.title
                  ) {
                    handleDelete();
                  }
                }}
                placeholder="Enter artifact title to confirm"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingArtifact(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmation !== deletingArtifact?.title}
            >
              Delete Artifact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
