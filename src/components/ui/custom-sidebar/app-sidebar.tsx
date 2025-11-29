"use client";

import { Blocks, Box, ChevronUp, Moon, Plus, Sun } from "lucide-react";
import { Button } from "../button";
import {
  Sidebar,
  SidebarGroup,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupAction,
  SidebarSeparator,
} from "../sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import ExistingChats from "../existing-chats";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { useTheme } from "next-themes";
import { Switch } from "../switch";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { type User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "../avatar";
import { redirect, useRouter } from "next/navigation";
import { Database } from "@/app/types/database.types";
import { Separator } from "../separator";

export default function AppSidebar({
  className,
  chats,
}: {
  className?: string;
  chats: Database["public"]["Tables"]["chat"]["Row"][];
}) {
  const router = useRouter();
  const supabase = createClient();
  const { open, setOpen } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
    };
    fetchUser();
  }, [supabase]);
  return (
    <Sidebar className={cn(className)}>
      <SidebarHeader>
        <SidebarTrigger onClick={() => setOpen(!open)} />
        <Button
          className="border-border ring-2 ring-border/50"
          onClick={() => {
            router.push("/");
          }}
        >
          <Plus />
          New Chat
        </Button>
        <div className="flex flex-col gap-0">
          <SidebarMenuButton>
            <Box />
            Artifacts
          </SidebarMenuButton>

          <SidebarMenuButton>
            <Blocks />
            Apps
          </SidebarMenuButton>
        </div>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <ExistingChats chats={chats} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Avatar className="size-5 ring-1 ring-border">
                    <AvatarImage src={user?.user_metadata.avatar_url} />
                    <AvatarFallback>
                      {user?.email?.slice(0, 2).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>

                  {user?.email ?? "User"}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem
                  variant="destructive"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setOpen(false);
                    redirect("/login");
                  }}
                >
                  Sign Out
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                  {theme === "dark" && <Sun />}
                  {theme === "light" && <Moon />}

                  {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="mode-toggle"
                      checked={theme === "dark"}
                      onCheckedChange={() =>
                        setTheme(theme === "dark" ? "light" : "dark")
                      }
                    />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
