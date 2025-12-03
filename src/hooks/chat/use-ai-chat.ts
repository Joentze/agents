// extended hook for ai-sdk
import { useChat } from "@ai-sdk/react";
import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import {
  DefaultChatTransport,
  UIMessagePart,
  UIDataTypes,
  UITools,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useArtifactStore } from "@/hooks/artifact/use-artifact";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { Database } from "@/app/types/database.types";
import { createChat, updateChat } from "@/app/actions/chat-actions";
import { createMessage } from "@/app/actions/message-actions";
import { createArtifact } from "@/app/actions/artifact-actions";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { McpOAuthProvider } from "@/utils/mcp/mcp-oauth-provider";
import { Client } from "@modelcontextprotocol/sdk/client";
import { McpToolWithoutClientName, useMcpStore } from "@/stores/use-mcps";

function useAiChat({
  messages = [],
  chatId,
}: {
  messages?: Database["public"]["Tables"]["message"]["Row"][];
  chatId?: string;
}) {
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [mcpLoading, setMcpLoading] = useState<boolean>(false);
  // Only subscribe to state values we need in the return
  const currentArtifact = useArtifactStore((state) => state.currentArtifact);
  const artifacts = useArtifactStore((state) => state.artifacts);
  const appBuilderStatus = useAppBuilder((state) => state.status);
  const errorMessage = useAppBuilder((state) => state.errorMessage);
  const previewUrl = useAppBuilder((state) => state.previewUrl);
  const currentPath = useAppBuilder((state) => state.currentPath);
  const sandboxId = useAppBuilder((state) => state.sandboxId);

  const runs = useChainOfThoughtStore((state) => state.runs);
  const handleToolCallRef = useRef<((params: any) => Promise<void>) | null>(
    null
  );

  const handleToolCall = useCallback(async (params: any) => {
    return handleToolCallRef.current?.(params);
  }, []);

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
          break;
        default:
          break;
      }
    },

    onFinish: async () => {
      if (!chatId) {
        return;
      }
      await updateChat(chatId as string, {
        updated_at: new Date().toISOString(),
      });

      // Check if the last assistant message has tool calls
      // If it does, don't save yet - wait for the tool execution cycle to complete
      // const lastMessage = messages[messages.length - 1];
      // if (
      //   lastMessage?.role === "assistant" &&
      //   lastMessage?.parts?.some((part) => part.type === "tool-call")
      // ) {
      //   console.log("Skipping save - tool calls pending");
      //   return;
      // }
    },
    onToolCall: handleToolCall,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  handleToolCallRef.current = async ({
    toolCall,
  }: {
    toolCall: {
      dynamic: boolean;
      toolName: string;
      toolCallId: string;
      input: any;
    };
  }) => {
    let output;
    const { dynamic, toolName, toolCallId, input } = toolCall;
    if (!dynamic) {
      return;
    }
    const tool = useMcpStore.getState().getTool(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    const { clientName } = tool;
    if (!clientName) {
      throw new Error(`Client for tool ${toolName} not found`);
    }
    const client = clients[clientName];
    if (!client) {
      throw new Error(`Client ${clientName} not found`);
    }
    output = await client.callTool({
      name: toolName,
      arguments: input,
    });

    try {
      aiSdkUseChat.addToolResult({
        state: "output-available",
        toolCallId,
        tool: toolName,
        output,
      });
    } catch (error) {
      console.error(error);
      aiSdkUseChat.addToolResult({
        state: "output-error",
        toolCallId,
        tool: toolName,
        errorText: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const hasInitializedClients = useRef<boolean>(false);
  const clientsRef = useRef<Record<string, Client>>({});

  // close apps and artifacts
  useEffect(() => {
    const startClientConnections = async () => {
      setMcpLoading(true);
      if (hasInitializedClients.current) return;
      hasInitializedClients.current = true;

      const connectedClients = await useMcpStore.getState().initClientTools();
      const clientsMap = connectedClients.reduce((acc, { name, client }) => {
        acc[name] = client;
        return acc;
      }, {} as Record<string, Client>);

      clientsRef.current = clientsMap;
      setClients(clientsMap);
      setMcpLoading(false);
    };

    startClientConnections();

    return () => {
      useChainOfThoughtStore.getState().clearRuns();
      useArtifactStore.getState().clearCurrentArtifact();
      useAppBuilder.getState().clearApp();

      Object.values(clientsRef.current).forEach(async (client) => {
        client.close().catch(console.error);
      });

      useMcpStore.setState({ tools: {} });
      setMcpLoading(false);
      setClients({});
    };
  }, []);
  const hasLoadedMcpCredentials = useRef<boolean>(false);
  // load mcp credentials on redirects
  useEffect(() => {
    // In your main app
    const loadMcpCredentials = async () => {
      console.log("Loading MCP credentials");
      const storedCode = sessionStorage.getItem("oauth_code");
      console.log("storedCode", storedCode);
      const authenticatingMcp = JSON.parse(
        sessionStorage.getItem("authenticating_mcp") || "{}"
      );
      console.log("authenticatingMcp", authenticatingMcp);

      try {
        if (storedCode && authenticatingMcp) {
          const { name, url } = authenticatingMcp;
          const authProvider = new McpOAuthProvider(url, name);

          const transport = new StreamableHTTPClientTransport(new URL(url), {
            authProvider,
          });

          // Complete the OAuth flow
          await transport.finishAuth(storedCode);

          const client = new Client({
            version: "1.0.0",
            name,
          });
          const aisdkClient = await createMCPClient({
            name,
            transport: {
              type: "http",
              url,
              authProvider,
            },
          });
          console.log(
            "aisdk client created",
            (await aisdkClient.tools())[0].outputSchema
          );

          await client.connect(transport);
          console.log(await client.listTools());
          // add client

          setClients((prev) => {
            const updated = { ...prev, [name]: client };
            clientsRef.current = updated;
            return updated;
          });
          // add tools
          const { tools } = await client.listTools();

          useMcpStore
            .getState()
            .addTools(name, tools as McpToolWithoutClientName[]);

          // Clean up OAuth state after successful connection
          authProvider.clearOAuthState();
          sessionStorage.removeItem("oauth_code");
          sessionStorage.removeItem("authenticating_mcp");
        }
      } catch {
        // Clean up on error as well
        sessionStorage.removeItem("authenticating_mcp");
        sessionStorage.removeItem("oauth_code");
      }
    };
    if (!hasLoadedMcpCredentials.current) {
      loadMcpCredentials();
      hasLoadedMcpCredentials.current = true;
    }
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
    mcpTools: useMcpStore.getState().tools,
    mcpLoading,
  };
}

export { useAiChat };
