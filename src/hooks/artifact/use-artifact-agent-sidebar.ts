import { FileUIPart } from "ai";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ArtifactAgentSidebarStore {
  open: boolean;
  setOpen: (open: boolean) => void;
  artifactFiles: FileUIPart[];
  artifactContents: { content: string; id: string }[];
  addArtifactFile: (file: FileUIPart) => void;
  removeArtifactFile: (url: string) => void;
  clearArtifactFiles: () => void;
  addArtifactContent: (content: string, id: string) => void;
  removeArtifactContent: (id: string) => void;
  removeLastArtifactContent: () => void;
  clearArtifactContents: () => void;
}

const useArtifactAgentSidebar = create<ArtifactAgentSidebarStore>()(
  persist(
    (set) => ({
      open: false,
      setOpen: (open: boolean) => set({ open }),
      clearArtifactContents: () => set({ artifactContents: [] }),
      artifactFiles: [],
      artifactContents: [],
      addArtifactFile: (file: FileUIPart) =>
        set((state) => ({ artifactFiles: [...state.artifactFiles, file] })),
      removeArtifactFile: (url: string) =>
        set((state) => ({
          artifactFiles: state.artifactFiles.filter((f) => f.url !== url),
        })),
      removeLastArtifactContent: () =>
        set((state) => ({
          artifactContents: state.artifactContents.slice(0, -1),
        })),
      clearArtifactFiles: () => set({ artifactFiles: [] }),
      addArtifactContent: (content: string, id: string) =>
        set((state) => {
          // Don't add if an artifact with the same id already exists
          if (state.artifactContents.some((c) => c.id === id)) {
            return state;
          }
          return {
            artifactContents: [...state.artifactContents, { content, id }],
          };
        }),
      removeArtifactContent: (id: string) =>
        set((state) => ({
          artifactContents: state.artifactContents.filter((c) => c.id !== id),
        })),
    }),
    {
      name: "artifact-agent-sidebar",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
export { useArtifactAgentSidebar };
