// extended hook for ai-sdk
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessagePart, UIDataTypes, UITools } from "ai";
import { useArtifactStore } from "@/hooks/artifact/use-artifact";
import { useEffect } from "react";
import { useChainOfThoughtStore } from "../chain-of-thought/use-chain-of-thought";
import {
  ChainOfThoughtRun,
  StepUpdateType,
} from "@/app/types/chain-of-thought";
import { ArtifactStart } from "@/app/types/artifact";
import { useAppBuilder } from "../app-builder/use-app-builder";
import {
  AppBuilderLogsDataPart,
  AppBuilderStatusDataPart,
} from "@/app/types/app-agent";
import { createClient } from "@/utils/supabase/client";
import { Database } from "@/app/types/database.types";
import { createChat, updateChat } from "@/app/actions/chat-actions";
import { createMessage } from "@/app/actions/message-actions";
import { useSidebar } from "../use-sidebar";
import { createArtifact } from "@/app/actions/artifact-actions";

function useAiChat({
  messages = [],
  chatId,
}: {
  messages?: Database["public"]["Tables"]["message"]["Row"][];
  chatId?: string;
}) {
  // Only subscribe to state values we need in the return
  const currentArtifact = useArtifactStore((state) => state.currentArtifact);
  const artifacts = useArtifactStore((state) => state.artifacts);
  const supabase = createClient();
  const appBuilderStatus = useAppBuilder((state) => state.status);
  const errorMessage = useAppBuilder((state) => state.errorMessage);
  const previewUrl = useAppBuilder((state) => state.previewUrl);
  const currentPath = useAppBuilder((state) => state.currentPath);
  const sandboxId = useAppBuilder((state) => state.sandboxId);

  const runs = useChainOfThoughtStore((state) => state.runs);

  const aiSdkUseChat = useChat({
    id: chatId,
    messages: messages.map(({ id, role, parts, metadata }) => ({
      id,
      role: role as "system" | "user" | "assistant",
      parts: parts as UIMessagePart<UIDataTypes, UITools>[],
      metadata: metadata as UIDataTypes,
    })),
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onData: async ({ data, type, id: artifactRunId }) => {
      switch (type) {
        case "data-chain-of-thought-run-start":
          const {
            id,
            type: runType,
            startDatetime: runStart,
            status,
            steps,
          } = data as unknown as ChainOfThoughtRun;
          useChainOfThoughtStore.getState().addRun({
            id,
            status,
            type: runType,
            startDatetime: runStart,
            steps,
          });
          break;
        case "data-chain-of-thought-step-update":
          const {
            runId,
            stepId,
            type,
            status: stepStatus,
            data: stepData,
            startDatetime,
            endDatetime,
          } = data as unknown as StepUpdateType;
          const currentRuns = useChainOfThoughtStore.getState().runs;
          if (!Object.keys(currentRuns[runId]?.steps || {}).includes(stepId)) {
            useChainOfThoughtStore.getState().addStep(runId, {
              runId,
              stepId,
              type,
              status: stepStatus,
              data: stepData,
              startDatetime,
              endDatetime,
            });
          } else {
            useChainOfThoughtStore.getState().updateStep(runId, stepId, {
              runId,
              stepId,
              type,
              status: stepStatus,
              data: stepData,
              startDatetime,
              endDatetime,
            });
          }
          break;
        case "data-chain-of-thought-run-end":
          const { id: currentRunId, status: runStatus } =
            data as unknown as ChainOfThoughtRun;

          useChainOfThoughtStore.getState().updateRun(currentRunId, {
            status: runStatus,
          });

          break;
        case "data-artifact-start":
          const { title, description, plan } = data as unknown as ArtifactStart;
          useArtifactStore
            .getState()
            .setCurrentArtifact(artifactRunId as string);
          useArtifactStore
            .getState()
            .initArtifact(artifactRunId as string, title, description, plan);
          break;
        case "data-artifact-end":
          const {
            title: artifactTitle,
            description: artifactDescription,
            content: artifactContent,
          } = data as unknown as {
            title: string;
            description: string;
            content: string;
          };
          await createArtifact({
            callId: artifactRunId as string,
            title: artifactTitle,
            description: artifactDescription,
            content: artifactContent,
            chatId: chatId as string,
          });
          break;
        case "data-artifact-delta":
          const { delta } = data as unknown as {
            delta: string;
          };
          useArtifactStore
            .getState()
            .addArtifactDelta(artifactRunId as string, delta);
          break;
        case "data-app-builder-status":
          const {
            status: builderStatus,
            sandboxId: builderSandboxId,
            errorMessage: builderErrorMessage,
            previewUrl: builderPreviewUrl,
          } = data as unknown as AppBuilderStatusDataPart;

          useAppBuilder.getState().updateStatus({
            status: builderStatus,
            sandboxId: builderSandboxId,
            errorMessage: builderErrorMessage,
            previewUrl: builderPreviewUrl,
          });
          break;

        case "data-app-builder-create-file":
          const { path: appBuilderCreateFilePath } = data as unknown as {
            path: string;
          };
          useAppBuilder.getState().createFile(appBuilderCreateFilePath, "");
          break;
        case "data-app-builder-file-content-delta":
          const { path, delta: appBuilderFileTextDelta } = data as unknown as {
            path: string;
            delta: string;
          };
          useAppBuilder.getState().updateFile(path, appBuilderFileTextDelta);
          break;
        case "data-app-builder-logs":
          const { level, message, timestamp } =
            data as unknown as AppBuilderLogsDataPart;
          useAppBuilder.getState().addLog({ level, message, timestamp });
          break;
        case "data-new-chat-title":
          const { title: newChatTitle } = data as unknown as {
            title: string;
          };
          await createChat({ id: chatId, name: newChatTitle });
          break;
        default:
          break;
      }
    },

    onFinish: async ({ messages }) => {
      const [user, assistant] = messages
        .slice(-2)
        .map(({ role, parts, metadata }) => {
          return {
            chatId,
            role,
            parts,
            metadata: metadata ?? {},
            attachments: [],
          };
        });

      // save message to db
      await Promise.all([
        createMessage(
          chatId as string,
          [
            user,
            assistant,
          ] as Database["public"]["Tables"]["message"]["Insert"][]
        ),
        updateChat(chatId as string, {
          updated_at: new Date().toISOString(),
        }),
      ]);
    },
  });

  useEffect(() => {
    return () => {
      useChainOfThoughtStore.getState().clearRuns();
      useArtifactStore.getState().clearCurrentArtifact();
      useAppBuilder.getState().clearApp();
    };
  }, []);
  return {
    ...aiSdkUseChat,
    runs,
    currentArtifact,
    artifacts,
    currentPath,
    sandboxId,
    appBuilderStatus,
    errorMessage,
    previewUrl,
  };
}

export { useAiChat };
