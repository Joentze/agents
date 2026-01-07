import { create } from "zustand";
import { Editor } from "@tiptap/core";

interface YouTubeDialogState {
  open: boolean;
  editor: Editor | null;
  range: { from: number; to: number } | null;
  openDialog: (editor: Editor, range: { from: number; to: number }) => void;
  closeDialog: () => void;
}

export const useYouTubeDialogStore = create<YouTubeDialogState>((set) => ({
  open: false,
  editor: null,
  range: null,
  openDialog: (editor, range) => set({ open: true, editor, range }),
  closeDialog: () => set({ open: false, editor: null, range: null }),
}));

