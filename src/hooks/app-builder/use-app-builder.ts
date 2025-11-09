import {
  AppBuilderStatus,
  AppBuilderStatusDataPart,
} from "@/app/types/app-agent";
import { create } from "zustand";
type File = {
  path: string;
  content: string;
};

interface AppBuilderStore {
  currentPath: string | undefined;
  sandboxId: string | undefined;
  status: AppBuilderStatus;
  files: Record<string, File>;
  errorMessage: string | undefined;
  previewUrl: string | undefined;
  createFile: (path: string, content: string) => void;
  updateFile: (path: string, content: string) => void;
  updateStatus: (status: AppBuilderStatusDataPart) => void;
}

const useAppBuilder = create<AppBuilderStore>((set, get) => ({
  currentPath: undefined,
  sandboxId: undefined,
  status: "not-started" as AppBuilderStatus,
  files: {},
  errorMessage: undefined,
  previewUrl: undefined,
  createFile: (path, content) => {
    set((state) => ({
      files: { ...state.files, [path]: { path, content } },
      currentPath: path,
    }));
  },
  updateFile: (path, content) => {
    set((state) => ({
      files: {
        ...state.files,
        [path]: { path, content: (get().files[path]?.content ?? "") + content },
      },
    }));
  },
  updateStatus: (status: AppBuilderStatusDataPart) =>
    set((state) => ({ ...state, ...status })),
}));

export { useAppBuilder, type AppBuilderStore, type File };
