"use client";

import {
  getArtifacts,
  getArtifactsInFolder,
} from "@/app/actions/artifact-actions";
import { Database } from "@/app/types/database.types";
import { Loader } from "@/components/ai-elements/loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 px-1">
        {artifacts.map((artifact) => (
          <Card
            key={artifact.id}
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
              <CardDescription className="line-clamp-2 ">
                {artifact.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-4 font-serif">
                {artifact.content.slice(0, 100)}...
              </p>
            </CardContent>
          </Card>
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
    </>
  );
}
