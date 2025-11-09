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
import { File as CodeFile } from "@/hooks/app-builder/use-app-builder";
import { useEffect, useState } from "react";
import { AppBuilderStatus } from "@/app/types/app-agent";

function AppBuilderRenderer({
  files,
  currentPath,
  status,
  previewUrl = undefined,
}: {
  previewUrl?: string | undefined;
  files: Record<string, CodeFile>;
  currentPath: string | undefined;
  status: AppBuilderStatus;
}) {
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
      className="flex flex-col min-w-2/3 max-w-2/3"
    >
      <Artifact className="m-4 flex-1 ">
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
          {mode === "code" && (
            <FileExplorer
              className="h-full w-full "
              currentPath={currentPath}
              paths={Object.keys(files)}
              files={files}
            />
          )}
          {mode === "preview" && (
            <iframe
              src={previewUrl}
              className="h-full w-full"
              title="Preview"
            />
          )}
        </ArtifactContent>
      </Artifact>
    </motion.div>
  );
}

export default AppBuilderRenderer;
