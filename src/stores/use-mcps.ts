import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import { Client } from "@modelcontextprotocol/sdk/client";
import { McpOAuthProvider } from "@/utils/mcp/mcp-oauth-provider";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";

interface McpServerData {
  tokens: OAuthTokensWithExpiresAt;
  name: string;
}

interface McpTool {
  clientName: string;
  name: string;
  title: string;
  description: string;
  inputSchema: {
    [x: string]: unknown;
    type: "object";
    properties?: Record<string, object> | undefined;
    required?: string[] | undefined;
  };
}

type McpToolWithoutClientName = Omit<McpTool, "clientName">;
type OAuthTokensWithExpiresAt = OAuthTokens & {
  expires_at: string | undefined;
};
interface McpStore {
  tools: Record<string, McpTool>; // keyed by tool name
  servers: Record<string, McpServerData>; // keyed by serverUrl
  setServer: (
    serverUrl: string,
    tokens: OAuthTokensWithExpiresAt,
    name: string
  ) => void;
  getTokens: (serverUrl: string) => OAuthTokensWithExpiresAt | undefined;
  getName: (serverUrl: string) => string | undefined;
  getServer: (serverUrl: string) => McpServerData | undefined;
  clearServer: (serverUrl: string) => void;
  listServers: () => {
    url: string;
    tokens: OAuthTokensWithExpiresAt;
    name: string;
  }[];
  getTool: (toolName: string) => McpTool | undefined;
  listTools: () => McpTool[];
  initClientTools: () => Promise<{ name: string; client: Client }[]>;
  addTools: (clientName: string, tools: McpToolWithoutClientName[]) => void;
}

const useMcpStore = create<McpStore>()(
  persist(
    (set, get) => ({
      tools: {},
      servers: {},
      setServer: (serverUrl: string, tokens: OAuthTokens, name: string) => {
        const expiresIn = tokens.expires_in;
        const now = new Date();
        const expiresAt = expiresIn
          ? new Date(now.getTime() + expiresIn * 1000).toISOString()
          : undefined;
        set((state) => ({
          servers: {
            ...state.servers,
            [serverUrl]: { tokens: { ...tokens, expires_at: expiresAt }, name },
          },
        }));
      },
      getTokens: (serverUrl: string) => get().servers[serverUrl]?.tokens,
      getName: (serverUrl: string) => get().servers[serverUrl]?.name,
      getServer: (serverUrl: string) => get().servers[serverUrl],
      clearServer: (serverUrl: string) =>
        set((state) => {
          const { [serverUrl]: _, ...rest } = state.servers;
          return { servers: rest };
        }),
      listServers: () =>
        Object.entries(get().servers).map(([url, data]) => ({
          url,
          tokens: data.tokens,
          name: data.name,
        })),
      getTool: (toolName: string) => get().tools[toolName],
      listTools: () => Object.values(get().tools),
      initClientTools: async () => {
        const servers = get().listServers();
        const initServersPromises = servers.map(async ({ name, url }) => {
          try {
            const authProvider = new McpOAuthProvider(url, name);
            const transport = new StreamableHTTPClientTransport(new URL(url), {
              authProvider,
            });
            const client = new Client({
              version: "1.0.0",
              name,
            });
            try {
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
                await aisdkClient.listResources()
              );
            } catch (error) {
              console.error("error creating aisdk client", error);
            }

            await client.connect(transport);
            const { tools } = await client.listTools();
            return tools.map((tool) => ({
              client,
              clientName: name,
              title: tool.title ?? "",
              description: tool.description ?? "",
              inputSchema: tool.inputSchema,
              name: tool.name,
            }));
          } catch (error) {
            console.error(error);
            return [];
          }
        });
        const toolsArrays = await Promise.all(initServersPromises);
        const flattened = toolsArrays.flat();

        // Build tools Record keyed by tool name
        const toolsRecord = flattened.reduce((acc, tool) => {
          acc[tool.name] = {
            clientName: tool.clientName,
            name: tool.name,
            title: tool.title,
            description: tool.description,
            inputSchema: tool.inputSchema,
          };
          return acc;
        }, {} as Record<string, McpTool>);

        const connectedClients = flattened.map(({ clientName, client }) => ({
          name: clientName,
          client,
        }));

        set((state) => ({ tools: { ...state.tools, ...toolsRecord } }));
        return connectedClients;
      },
      addTools: (clientName: string, tools: McpToolWithoutClientName[]) =>
        set((state) => {
          const newTools = tools.reduce((acc, tool) => {
            acc[tool.name] = {
              clientName,
              name: tool.name,
              title: tool.title ?? "",
              description: tool.description ?? "",
              inputSchema: tool.inputSchema,
            };
            return acc;
          }, {} as Record<string, McpTool>);

          return { tools: { ...state.tools, ...newTools } };
        }),
    }),
    {
      name: "mcp-tokens-storage", // localStorage key
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export {
  useMcpStore,
  type McpTool,
  type McpToolWithoutClientName,
  type McpServerData,
  type McpStore,
};
