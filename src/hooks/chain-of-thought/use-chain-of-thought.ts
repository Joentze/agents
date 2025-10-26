import {
  ChainOfThoughtRun,
  StepUpdateType,
} from "@/app/types/chain-of-thought";
import { create } from "zustand";

interface ChainOfThoughtState {
  runs: Record<string, ChainOfThoughtRun>;
  addRun: (run: ChainOfThoughtRun) => void;
  updateRun: (runId: string, run: Partial<ChainOfThoughtRun>) => void;
  addStep: (runId: string, step: StepUpdateType) => void;
  updateStep: (runId: string, stepId: string, step: StepUpdateType) => void;
  clearRuns: () => void;
}

const useChainOfThoughtStore = create<ChainOfThoughtState>((set) => ({
  runs: {},
  clearRuns: () => set({ runs: {} }),
  addRun: (run) => set((state) => ({ runs: { ...state.runs, [run.id]: run } })),
  updateRun: (runId, run) =>
    set((state) => ({
      runs: {
        ...state.runs,
        [runId]: {
          ...state.runs[runId],
          ...run,
        },
      },
    })),
  addStep: (runId, step) =>
    set((state) => ({
      runs: {
        ...state.runs,
        [runId]: {
          ...state.runs[runId],
          steps: {
            ...state.runs[runId].steps,
            [step.stepId]: {
              id: step.stepId,
              status: step.status,
              type: step.type,
              data: step.data,
              startDatetime: step.startDatetime,
              endDatetime: step.endDatetime,
            },
          },
        },
      },
    })),
  updateStep: (runId, stepId, step) =>
    set((state) => ({
      runs: {
        ...state.runs,
        [runId]: {
          ...state.runs[runId],
          steps: {
            ...state.runs[runId].steps,
            [stepId]: {
              id: stepId,
              status: step.status,
              type: step.type,
              data: step.data,
              startDatetime: step.startDatetime,
              endDatetime: step.endDatetime,
            },
          },
        },
      },
    })),
}));

export { useChainOfThoughtStore };
