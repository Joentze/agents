// extended hook for ai-sdk
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useArtifactStore } from "@/hooks/artifact/use-artifact";
import { useState } from "react";

type SearchResults = Record<
  string,
  {
    query: string;
    results: { url: string; title: string }[];
  }
>;

function useAiChat() {
  const { addArtifact, setCurrent, appendArtifactContent } = useArtifactStore();
  const [searchResults, setSearchResults] = useState<
    SearchResults | undefined
  >();
  const aiSdkUseChat = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onData: ({ data, type }) => {
      switch (type) {
        case "data-search-call":
          const { id, query } = data as { id: string; query: string };
          setSearchResults((prev) => ({
            ...prev,
            [id]: {
              query: query,
              results: [],
            },
          }));
          break;
        case "data-search-result":
          const { id: resultId, results } = data as {
            id: string;
            results: { url: string; title: string }[];
          };
          setSearchResults((prev) => ({
            ...prev,
            [resultId]: {
              query: prev?.[resultId]?.query || "",
              results: [...(prev?.[resultId]?.results || []), ...results],
            },
          }));
          break;
        default:
          break;
      }
    },
  });
  return { ...aiSdkUseChat, searchResults };
}

export { useAiChat };
