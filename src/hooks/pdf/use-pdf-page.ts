import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface PdfPageStore {
    files: Record<string, number>;
    setPage: (fileUrl: string, page: number) => void;
    getPage: (fileUrl: string) => number;
    clearPages: () => void;
}

const usePdfPageStore = create<PdfPageStore>()(
    persist(
        (set, get) => ({
            files: {},
            setPage: (fileUrl: string, page: number) => {
                set((state) => ({ files: { ...state.files, [fileUrl]: page } }));
            },
            getPage: (fileUrl: string) => {
                return get().files[fileUrl] || 1;
            },
            clearPages: () => {
                set({ files: {} });
            },
        }),
        {
            name: "pdf-page",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export { usePdfPageStore };
