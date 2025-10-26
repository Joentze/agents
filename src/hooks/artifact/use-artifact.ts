import { create } from "zustand";

interface ArtifactBody {
  content: string;
  title: string;
  description: string;
  plan: string;
}
interface ArtifactStore {
  artifacts: Record<string, ArtifactBody>;
  initArtifact: (
    id: string,
    title: string,
    description: string,
    plan: string
  ) => void;
  addArtifactDelta: (id: string, delta: string) => void;
  currentArtifact: string | undefined;
  setCurrentArtifact: (id: string) => void;
  clearCurrentArtifact: () => void;
}

const useArtifactStore = create<ArtifactStore>((set, get) => ({
  currentArtifact: undefined,
  artifacts: {},
  initArtifact: (id, title, description, plan) => {
    set((state) => ({
      artifacts: {
        ...state.artifacts,
        [id]: { content: "", title, description, plan },
      },
    }));
  },
  addArtifactDelta: (id, delta) => {
    if (!get().artifacts[id]) {
      throw new Error(`Artifact ${id} not found`);
    }
    const artifact = get().artifacts[id];
    set((state) => ({
      artifacts: {
        ...state.artifacts,
        [id]: { ...artifact, content: artifact.content + delta },
      },
    }));
  },
  setCurrentArtifact: (id) => {
    set({ currentArtifact: id });
  },
  clearCurrentArtifact: () => {
    set({ currentArtifact: undefined });
  },
}));

export { useArtifactStore };
