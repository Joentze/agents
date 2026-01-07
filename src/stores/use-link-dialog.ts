import { create } from "zustand";
import { Editor } from "@tiptap/core";

interface LinkDialogState {
  open: boolean;
  editor: Editor | null;
  range: { from: number; to: number } | null;
  defaultText: string;
  defaultUrl: string;
  openDialog: (
    editor: Editor,
    range: { from: number; to: number },
    options?: { defaultText?: string; defaultUrl?: string }
  ) => void;
  closeDialog: () => void;
}

export const useLinkDialogStore = create<LinkDialogState>((set) => ({
  open: false,
  editor: null,
  range: null,
  defaultText: "",
  defaultUrl: "",
  openDialog: (editor, range, options) =>
    set({
      open: true,
      editor,
      range,
      defaultText: options?.defaultText ?? "",
      defaultUrl: options?.defaultUrl ?? "",
    }),
  closeDialog: () =>
    set({ open: false, editor: null, range: null, defaultText: "", defaultUrl: "" }),
}));

