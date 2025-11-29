import {
  AppBuilderLogsDataPart,
  AppBuilderStatus,
  AppBuilderStatusDataPart,
} from "@/app/types/app-agent";
import { create } from "zustand";
type File = {
  path: string;
  content: string;
};

interface AppBuilderStore {
  logs: AppBuilderLogsDataPart[];
  paths: string[];
  currentPath: string | undefined;
  sandboxId: string | undefined;
  status: AppBuilderStatus;
  files: Record<string, string>;
  errorMessage: string | undefined;
  previewUrl: string | undefined;
  createFile: (path: string, content: string) => void;
  updateFile: (path: string, content: string) => void;
  updateStatus: (status: AppBuilderStatusDataPart) => void;
  addLog: (log: AppBuilderLogsDataPart) => void;
  clearApp: () => void;
}

const useAppBuilder = create<AppBuilderStore>((set, get) => ({
  logs: [],
  addLog: (log: AppBuilderLogsDataPart) => {
    set((state) => ({
      logs: [...state.logs, log],
    }));
  },
  paths: [],
  currentPath: undefined,
  sandboxId: undefined,
  status: "not-started" as AppBuilderStatus,
  files: {},
  errorMessage: undefined,
  previewUrl: undefined,
  createFile: (path, content) => {
    set((state) => ({
      files: { ...state.files, [path]: "" },
      paths: [...state.paths, path],
      currentPath: path,
    }));
  },
  clearApp: () => {
    set({
      logs: [],
      paths: [],
      currentPath: undefined,
      sandboxId: undefined,
      status: "not-started" as AppBuilderStatus,
    });
  },
  updateFile: (path, content) => {
    set((state) => ({
      files: {
        ...state.files,
        [path]: (get().files[path] ?? "") + content,
      },
    }));
  },
  updateStatus: (status: AppBuilderStatusDataPart) =>
    set((state) => ({ ...state, ...status })),
}));

export { useAppBuilder, type AppBuilderStore, type File };
