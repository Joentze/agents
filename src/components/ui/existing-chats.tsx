"use client";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarGroupLabel,
} from "./sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import Link from "next/link";
import { Database } from "@/app/types/database.types";
import { useParams, useRouter } from "next/navigation";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Input } from "./input";
import { useState, useRef, useEffect, useCallback } from "react";
import { deleteChat, updateChat, getChats } from "@/app/actions/chat-actions";
import { Loader } from "@/components/ai-elements/loader";

function ChatItem({
  id,
  name,
  isActive,
}: {
  id: string;
  name: string | null;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [chatName, setChatName] = useState(name || "Untitled Chat");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const handleBlur = async () => {
    setIsEditing(false);
    await updateChat(id, {
      name: chatName !== "" ? chatName : "Untitled Chat",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setChatName(name || "Untitled Chat");
      setIsEditing(false);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        {isEditing ? (
          <div className="flex items-center w-full">
            <Input
              ref={inputRef}
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="bg-transparent dark:bg-transparent h-5 ring-0 focus-visible:ring-0 border-none rounded-xs pl-1 -ml-1 shadow-none"
            />
          </div>
        ) : (
          <Link href={`/chat/${id}`} onDoubleClick={handleDoubleClick}>
            <span>{chatName}</span>
          </Link>
        )}
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover>
            <MoreHorizontal />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          {/* <DropdownMenuItem
            onClick={(e) => {
              setIsEditing(true);
              // Wait for dropdown to close and input to render
              setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
              }, 100);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            <span>Rename</span>
          </DropdownMenuItem> */}
          <DropdownMenuItem
            variant="destructive"
            onClick={async () => {
              try {
                await deleteChat(id);
                router.push("/");
              } catch (error) {
                console.error("Failed to delete chat:", error);
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

export default function ExistingChats({
  chats,
}: {
  chats: Database["public"]["Tables"]["chat"]["Row"][];
}) {
  const { chatId } = useParams<{ chatId: string }>();
  const [localChats, setLocalChats] = useState(chats);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(chats.length >= 30);
  const observerTarget = useRef<HTMLDivElement>(null);
  const limit = 30;

  useEffect(() => {
    setLocalChats(chats);
    setHasMore(chats.length >= limit);
  }, [chats]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const currentLength = localChats.length;
      const newChats = await getChats(currentLength, limit);

      if (newChats.length < limit) {
        setHasMore(false);
      }

      if (newChats.length > 0) {
        setLocalChats((prev) => {
          // Create a Set of existing IDs to avoid duplicates
          const existingIds = new Set(prev.map((c) => c.id));
          const uniqueNewChats = newChats.filter((c) => !existingIds.has(c.id));
          return [...prev, ...uniqueNewChats];
        });
      }
    } catch (error) {
      console.error("Error loading more chats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, localChats.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <SidebarGroup className="-mt-1">
      <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
      <SidebarMenu className="overflow-y-auto">
        {localChats.map(({ id, name }) => (
          <ChatItem
            key={id}
            id={id}
            name={name}
            isActive={chatId !== undefined && chatId === id}
          />
        ))}
        {hasMore && (
          <div
            ref={observerTarget}
            className="h-8 w-full flex justify-center items-center p-2"
          >
            {isLoading && <Loader size={16} className="opacity-50" />}
          </div>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
