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
import {
  File as CodeFile,
  useAppBuilder,
} from "@/hooks/app-builder/use-app-builder";
import { memo, useEffect, useState } from "react";
import { AppBuilderStatus } from "@/app/types/app-agent";
import {
  WebPreviewBody,
  WebPreviewNavigation,
  WebPreviewConsole,
  WebPreviewUrl,
} from "../web-preview";
import { WebPreview } from "../web-preview";
import { Loader } from "../loader";

const AppBuilderRenderer = memo(function renderer() {
  const status = useAppBuilder((state) => state.status);
  const logs = useAppBuilder((state) => state.logs);
  const previewUrl = useAppBuilder((state) => state.previewUrl);
  const [mode, setMode] = useState<"code" | "preview">("code");
  useEffect(() => {
    if (status === "completed" && previewUrl) {
      setMode("preview");
    }
  }, [status, previewUrl]);
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
          {mode === "preview" && (
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
