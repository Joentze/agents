import { create } from "zustand";
import { Editor } from "@tiptap/core";

type FilePickerType = "image" | "file" | "all";

interface FilePickerState {
  editor: Editor | null;
  type: FilePickerType;
  triggerPicker: (editor: Editor, type: FilePickerType) => void;
  clearPicker: () => void;
}

export const useFilePickerStore = create<FilePickerState>((set) => ({
  editor: null,
  type: "all",
  triggerPicker: (editor, type) => set({ editor, type }),
  clearPicker: () => set({ editor: null }),
}));

