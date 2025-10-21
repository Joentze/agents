import { create } from "zustand";

type ArtifactType = "document" | "code" | "notebok";

type Artifact = {
  type: ArtifactType;
  title: string;
  content: string;
};

type ArtifactWithId = Artifact & { id: string };

type ArtifactStore = {
  current: string | null;
  artifacts: Record<string, Artifact>;
  addArtifact: (artifact: ArtifactWithId) => void;
  appendArtifactContent: (id: string, contentPart: string) => void;
  setCurrent: (id: string | null) => void;
};

const useArtifactStore = create<ArtifactStore>((set) => ({
  current: null,
  artifacts: {},
  addArtifact: (artifact) =>
    set((state) => ({
      artifacts: { ...state.artifacts, [artifact.id]: artifact },
    })),
  appendArtifactContent: (id, contentPart) =>
    set((state) => ({
      artifacts: {
        ...state.artifacts,
        [id]: {
          ...state.artifacts[id],
          content: state.artifacts[id].content + contentPart,
        },
      },
    })),
  setCurrent: (id) => set({ current: id }),
}));

export { useArtifactStore };
