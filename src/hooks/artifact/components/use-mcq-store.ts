import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface Mcq {
  answeredOption: number | null;
  question: string;
  options: {
    option: string;
    isCorrect: boolean;
  }[];
}

interface McqStore {
  mcqs: Record<string, Mcq[]>;
  addMcqSet: (id: string, mcqs: Mcq[]) => void;
  clearMcqSet: (id: string) => void;
  resetMcqSet: (id: string) => void;
  answerMcq: (id: string, mcqIndex: number, optionIndex: number) => void;
  clearMcq: (id: string, mcqIndex: number) => void;
}

const useMcqStore = create<McqStore>()(
  persist(
    (set) => ({
      mcqs: {},
      addMcqSet: (id, mcqs) => {
        set((state) => ({ mcqs: { ...state.mcqs, [id]: mcqs } }));
      },
      clearMcqSet: (id) => {
        set((state) => ({ mcqs: { ...state.mcqs, [id]: [] } }));
      },
      resetMcqSet: (id) => {
        set((state) => ({
          mcqs: {
            ...state.mcqs,
            [id]: state.mcqs[id]?.map((mcq) => ({
              ...mcq,
              answeredOption: null,
            })),
          },
        }));
      },
      answerMcq: (id, mcqIndex, optionIndex) => {
        set((state) => ({
          mcqs: {
            ...state.mcqs,
            [id]: state.mcqs[id]?.map((mcq, idx) =>
              idx === mcqIndex ? { ...mcq, answeredOption: optionIndex } : mcq
            ),
          },
        }));
      },
      clearMcq: (id, mcqIndex) => {
        set((state) => ({
          mcqs: {
            ...state.mcqs,
            [id]: state.mcqs[id]?.map((mcq, idx) =>
              idx === mcqIndex ? { ...mcq, answeredOption: null } : mcq
            ),
          },
        }));
      },
    }),
    {
      name: "mcq-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export { useMcqStore };
export type { Mcq, McqStore };
