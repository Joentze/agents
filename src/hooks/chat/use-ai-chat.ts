// extended hook for ai-sdk
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useArtifactStore } from "@/hooks/artifact/use-artifact";
import { useEffect } from "react";
import { useChainOfThoughtStore } from "../chain-of-thought/use-chain-of-thought";
import {
  ChainOfThoughtRun,
  StepUpdateType,
} from "@/app/types/chain-of-thought";
import { ArtifactStart } from "@/app/types/artifact";

function useAiChat() {
  const {
    initArtifact,
    currentArtifact,
    artifacts,
    addArtifactDelta,
    setCurrentArtifact,
  } = useArtifactStore();

  const { runs, addRun, addStep, updateStep, clearRuns, updateRun } =
    useChainOfThoughtStore();
  useEffect(() => {
    if (currentArtifact && Object.keys(artifacts).includes(currentArtifact)) {
      console.log("artifacts", artifacts[currentArtifact]);
    }
  }, [artifacts, currentArtifact]);
  const aiSdkUseChat = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onData: ({ data, type, id: artifactRunId }) => {
      switch (type) {
        case "data-chain-of-thought-run-start":
          const {
            id,
            type: runType,
            startDatetime: runStart,
            status,
            steps,
          } = data as unknown as ChainOfThoughtRun;
          addRun({
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
          if (!Object.keys(runs[runId]?.steps || {}).includes(stepId)) {
            addStep(runId, {
              runId,
              stepId,
              type,
              status: stepStatus,
              data: stepData,
              startDatetime,
              endDatetime,
            });
          } else {
            updateStep(runId, stepId, {
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

          updateRun(currentRunId, {
            status: runStatus,
          });

          break;
        case "data-artifact-start":
          const { title, description, plan } = data as unknown as ArtifactStart;
          setCurrentArtifact(artifactRunId as string);
          initArtifact(artifactRunId as string, title, description, plan);
          break;
        case "data-artifact-delta":
          const { delta } = data as unknown as {
            delta: string;
          };
          addArtifactDelta(artifactRunId as string, delta);
          break;
        default:
          break;
      }
    },
  });
  useEffect(() => {
    return () => {
      clearRuns();
    };
  }, [clearRuns]);
  return { ...aiSdkUseChat, runs, currentArtifact, artifacts };
}

export { useAiChat };
