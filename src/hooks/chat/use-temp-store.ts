import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface TempStore {
  messages: Record<string, Record<string, unknown>>;
  removeKey: (key: string) => void;
  setKey: (key: string, value: Record<string, unknown>) => void;
}

const useTempStore = create<TempStore>()(
  persist(
    (set) => ({
      messages: {},
      setKey: (key: string, value: Record<string, unknown>) =>
        set((state) => ({
          messages: { ...state.messages, [key]: value },
        })),
      removeKey: (key) =>
        set((state) => {
          const { [key]: _, ...rest } = state.messages;
          return { messages: rest };
        }),
    }),
    {
      name: "temp-store",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export { useTempStore };
