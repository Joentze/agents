"use client";
import { motion } from "motion/react";
import {
  Artifact,
  ArtifactHeader,
  ArtifactActions,
  ArtifactContent,
  ArtifactAction,
} from "../artifact";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Eye, X } from "lucide-react";
import { FileExplorer } from "./file-tree";
import { useAppBuilder } from "@/hooks/app-builder/use-app-builder";
import { memo, useEffect, useState } from "react";
import {
  WebPreviewBody,
  WebPreviewNavigation,
  WebPreviewConsole,
  WebPreviewUrl,
} from "../web-preview";
import { WebPreview } from "../web-preview";

const AppBuilderRenderer = memo(function renderer() {
  const status = useAppBuilder((state) => state.status);
  const logs = useAppBuilder((state) => state.logs);
  const previewUrl = useAppBuilder((state) => state.previewUrl);
  const updateStatus = useAppBuilder((state) => state.updateStatus);
  const [mode, setMode] = useState<"code" | "preview">("code");

  useEffect(() => {
    if (status === "completed" && previewUrl) {
      setMode("preview");
    }
  }, [status, previewUrl]);

  // Check if sandbox is still alive using server-side health check (avoids CORS)
  useEffect(() => {
    if (!previewUrl || status !== "completed") return;

    let isMounted = true;
    let checkInterval: NodeJS.Timeout;
    let consecutiveFailures = 0;
    const maxFailures = 3; // Require 3 consecutive failures before marking as expired

    const checkSandboxHealth = async () => {
      try {
        // Use server-side endpoint to avoid CORS issues
        const response = await fetch("/api/sandbox-health", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ previewUrl }),
        });

        const data = await response.json();

        if (isMounted) {
          if (data.alive) {
            // Sandbox is still alive, reset failure counter
            consecutiveFailures = 0;
          } else {
            // Sandbox is down
            consecutiveFailures++;
            console.log(
              `Sandbox health check failed (${consecutiveFailures}/${maxFailures}):`,
              data
            );

            if (consecutiveFailures >= maxFailures) {
              console.log("Sandbox marked as expired");
              updateStatus({
                status: "expired",
                errorMessage:
                  "The sandbox has expired or is no longer available",
              });
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          consecutiveFailures++;
          console.error(
            `Error checking sandbox health (${consecutiveFailures}/${maxFailures}):`,
            error
          );

          if (consecutiveFailures >= maxFailures) {
            updateStatus({
              status: "expired",
              errorMessage: "The sandbox has expired or is no longer available",
            });
          }
        }
      }
    };

    // Start checking after 60 seconds (give sandbox time to initialize)
    // Then check every 30 seconds
    const initialDelay = setTimeout(() => {
      if (isMounted) {
        checkSandboxHealth();
        checkInterval = setInterval(checkSandboxHealth, 10000);
      }
    }, 60000);

    return () => {
      isMounted = false;
      clearTimeout(initialDelay);
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [previewUrl, status, updateStatus]);
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-screen"
    >
      <Artifact className="my-4 ml-0 mr-4 h-screen">
        <ArtifactHeader>
          <div>
            <Tabs
              value={mode}
              defaultValue={mode}
              onValueChange={(value) => setMode(value as "code" | "preview")}
            >
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="code">
                  <Code />
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <ArtifactActions>
            <ArtifactAction icon={X} label="Close" />
          </ArtifactActions>
        </ArtifactHeader>
        <ArtifactContent className="flex flex-row h-full p-0">
          {mode === "code" && <FileExplorer className="h-full w-full " />}
          {mode === "preview" && status === "expired" && (
            <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center">
              <div className="max-w-md space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground">
                  Sandbox Expired
                </h3>
                <p className="text-sm text-muted-foreground">
                  The sandbox preview is no longer available. Please create a
                  new app to continue.
                </p>
              </div>
            </div>
          )}
          {mode === "preview" && status !== "expired" && (
            <WebPreview defaultUrl={previewUrl}>
              <WebPreviewNavigation>
                <WebPreviewUrl />
              </WebPreviewNavigation>
              <iframe className="size-full" src={previewUrl} title="Preview" />
              <WebPreviewConsole
                defaultChecked={true}
                logs={logs.map((log) => ({
                  level: log.level,
                  message: log.message,
                  timestamp: new Date(log.timestamp),
                }))}
              />
            </WebPreview>
          )}
        </ArtifactContent>
      </Artifact>
    </motion.div>
  );
});

export default AppBuilderRenderer;
