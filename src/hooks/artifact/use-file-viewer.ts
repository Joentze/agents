import { create } from "zustand";

interface FileViewerState {
  isOpen: boolean;
  fileUrl: string | null;
  fileName: string | null;
  openFile: (url: string, name: string) => void;
  closeFile: () => void;
  isRight: boolean;
}

export const useFileViewer = create<FileViewerState>((set) => ({
  isRight: true,
  isOpen: false,
  fileUrl: null,
  fileName: null,
  openFile: (url: string, name: string) =>
    set({ isOpen: true, fileUrl: url, fileName: name }),
  closeFile: () => set({ isOpen: false, fileUrl: null, fileName: null }),
}));
