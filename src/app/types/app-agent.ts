import { AppRunner } from "../api/chat/classes/app-runner";
import { UIMessage, UIMessageStreamWriter } from "ai";

type AppAgentToolParams = {
  runner: AppRunner;
  writer: UIMessageStreamWriter;
  messages: UIMessage[];
};
type AppBuilderStatus =
  | "started"
  | "generating"
  | "error"
  | "completed"
  | "not-started";

type AppBuilderStatusDataPart = {
  status: AppBuilderStatus;
  sandboxId?: string | undefined;
  errorMessage?: string | undefined;
  previewUrl?: string | undefined;
};

export type { AppAgentToolParams, AppBuilderStatus, AppBuilderStatusDataPart };
