import { FileUIPart } from "ai";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ArtifactAgentSidebarStore {
  open: boolean;
  setOpen: (open: boolean) => void;
  artifactFiles: FileUIPart[];
  artifactContents: string[];
  addArtifactFile: (file: FileUIPart) => void;
  removeArtifactFile: (url: string) => void;
  clearArtifactFiles: () => void;
  addArtifactContent: (content: string) => void;
}

const useArtifactAgentSidebar = create<ArtifactAgentSidebarStore>()(
  persist(
    (set) => ({
      open: false,
      setOpen: (open: boolean) => set({ open }),
      artifactFiles: [],
      artifactContents: [],
      addArtifactFile: (file: FileUIPart) =>
        set((state) => ({ artifactFiles: [...state.artifactFiles, file] })),
      removeArtifactFile: (url: string) =>
        set((state) => ({
          artifactFiles: state.artifactFiles.filter((f) => f.url !== url),
        })),
      clearArtifactFiles: () => set({ artifactFiles: [] }),
      addArtifactContent: (content: string) =>
        set((state) => ({
          artifactContents: [...state.artifactContents, content],
        })),
    }),
    {
      name: "artifact-agent-sidebar",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
export { useArtifactAgentSidebar };
