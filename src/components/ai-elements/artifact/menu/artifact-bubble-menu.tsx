"use client";

import { Editor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Sparkle,
  SwatchBook,
  ListCheck,
  PenBox,
  Send,
  Highlighter,
  Check,
  X,
  Plus,
  Link,
} from "lucide-react";
import Color from "color";
import { highlightPresets } from "../custom/highlight";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ColorPicker,
  ColorPickerSelection,
  ColorPickerHue,
  ColorPickerAlpha,
  ColorPickerFormat,
  ColorPickerOutput,
  ColorPickerEyeDropper,
} from "@/components/ui/shadcn-io/color-picker";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import {
  type BubbleMenuAIGenerateOptions,
  BubbleAIGenerateInput,
  AIHighlightColors,
} from "./ai/bubble-ai-generate-input";
import { cn } from "@/lib/utils";
import { useLinkDialogStore } from "@/stores/use-link-dialog";
import { range } from "gotenberg-js-client";

interface ArtifactBubbleMenuProps {
  editor: Editor;
}

export function ArtifactBubbleMenu({ editor }: ArtifactBubbleMenuProps) {
  const {
    isLink,
    isBold,
    isItalic,
    isUnderline,
    isHighlight,
    highlightColor,
    linkUrl,
    selectedText,
  } = useEditorState({
    editor,
    selector: (ctx) => ({
      isLink: ctx.editor.isActive("link"),
      isTable: ctx.editor.isActive("table"),
      isBold: ctx.editor.isActive("bold"),
      isItalic: ctx.editor.isActive("italic"),
      isUnderline: ctx.editor.isActive("underline"),
      isHighlight: ctx.editor.isActive("highlight"),
      highlightColor: ctx.editor.getAttributes("highlight")?.color,
      linkUrl: ctx.editor.getAttributes("link")?.href,
      selectedText: ctx.editor.state.doc.textBetween(
        ctx.editor.state.selection.from,
        ctx.editor.state.selection.to
      ),
    }),
  });
  const bubbleMenuRef = useRef<HTMLDivElement>(null);
  const bubbleMenuContainerRef = useRef<HTMLDivElement>(null);
  const [aiGenerateOption, setAiGenerateOption] = useState<
    BubbleMenuAIGenerateOptions | undefined
  >(undefined);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const customColorRef = useRef<[number, number, number, number]>([
    254, 240, 138, 1,
  ]);
  // Store the highlighted range so we can remove the highlight later
  const highlightedRangeRef = useRef<{ from: number; to: number } | null>(null);
  // Ref to track if highlight is active (for use in callbacks to avoid stale closures)
  const hasHighlightRef = useRef(false);

  // Helper to apply highlight with the mode's color
  const applyHighlight = (option: BubbleMenuAIGenerateOptions) => {
    const { from, to } = editor.state.selection;
    highlightedRangeRef.current = { from, to };
    hasHighlightRef.current = true;
    const color = AIHighlightColors[option];
    editor.chain().setHighlight({ color }).run();
  };

  // Helper to remove highlight
  const removeHighlight = () => {
    if (highlightedRangeRef.current) {
      const { from, to } = highlightedRangeRef.current;
      // Restore the selection, unset highlight, then collapse cursor
      editor
        .chain()
        .setTextSelection({ from, to })
        .unsetHighlight()
        .setTextSelection(from)
        .run();
      highlightedRangeRef.current = null;
      hasHighlightRef.current = false;
    }
  };

  // Handle setting the AI generate option with highlight
  const handleSetAiGenerateOption = (
    option: BubbleMenuAIGenerateOptions | undefined
  ) => {
    if (option) {
      applyHighlight(option);
    } else {
      removeHighlight();
    }
    setAiGenerateOption(option);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSetAiGenerateOption(undefined);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <BubbleMenu
      editor={editor}
      ref={bubbleMenuRef}
      className="z-50"
      options={{
        onHide: () => {
          if (hasHighlightRef.current) {
            removeHighlight();
            setAiGenerateOption(undefined);
          }
        },
      }}
    >
      <motion.div
        ref={bubbleMenuContainerRef}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.2 }}
        className="tiptap-bubble-menu flex flex-row gap-2 p-1 border border-border ring-2 ring-border/50 z-3 bg-accent shadow-lg shadow-accent/50 rounded-full"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {aiGenerateOption === undefined && (
          <>
            <ButtonGroup className="rounded-full">
              <ButtonGroup className="rounded-full">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className={cn(
                        "rounded-full",
                        isHighlight && "bg-accent/50"
                      )}
                      variant={"outline"}
                      size={"icon-sm"}
                    >
                      {highlightColor ? (
                        <div
                          className="size-4 rounded-full border border-border/50"
                          style={{ backgroundColor: highlightColor }}
                        />
                      ) : (
                        <Highlighter />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuPortal
                    container={bubbleMenuContainerRef.current}
                  >
                    <DropdownMenuPrimitive.Content
                      sideOffset={4}
                      className="bg-accent mt-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 z-50 overflow-hidden rounded-full border p-1 shadow-md"
                      onCloseAutoFocus={(e) => {
                        e.preventDefault();
                      }}
                    >
                      <div className="flex flex-row gap-1">
                        {Object.entries(highlightPresets).map(
                          ([name, color]) => (
                            <DropdownMenuPrimitive.Item
                              key={name}
                              className="relative flex cursor-pointer items-center justify-center rounded-full p-0.5 outline-hidden select-none border border-transparent focus:border-border"
                              onClick={() => {
                                if (highlightColor === color) {
                                  editor.chain().focus().unsetHighlight().run();
                                } else {
                                  editor
                                    .chain()
                                    .focus()
                                    .setHighlight({ color })
                                    .run();
                                }
                              }}
                            >
                              <div
                                className="size-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                                style={{ backgroundColor: color }}
                                title={name}
                              >
                                {highlightColor === color && (
                                  <Check className="size-3.5 text-gray-700" />
                                )}
                              </div>
                            </DropdownMenuPrimitive.Item>
                          )
                        )}
                        <DropdownMenuPrimitive.Item
                          className="relative flex cursor-pointer items-center justify-center rounded-full p-0.5 outline-hidden select-none border border-transparent"
                          onClick={(e) => {
                            e.preventDefault();
                            setColorPickerOpen(true);
                          }}
                        >
                          <div className="size-6 rounded-full flex items-center justify-center border border-dashed border-border bg-background transition-transform hover:scale-110">
                            <Plus className="size-3.5 text-muted-foreground" />
                          </div>
                        </DropdownMenuPrimitive.Item>
                        {isHighlight && (
                          <DropdownMenuPrimitive.Item
                            className="relative flex cursor-pointer items-center justify-center rounded-full p-0.5 outline-hidden select-none border border-transparent"
                            onClick={() => {
                              editor.chain().focus().unsetHighlight().run();
                            }}
                          >
                            <div className="size-6 rounded-full flex items-center justify-center border border-border bg-background ">
                              <X className="size-3.5 text-muted-foreground" />
                            </div>
                          </DropdownMenuPrimitive.Item>
                        )}
                      </div>
                    </DropdownMenuPrimitive.Content>
                  </DropdownMenuPortal>
                </DropdownMenu>
                <Button
                  className={cn("rounded-full", isBold && "bg-accent/50")}
                  variant={"outline"}
                  size={"icon-sm"}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                >
                  <Bold />
                </Button>
                <Button
                  className={cn("", isItalic && "bg-accent/50")}
                  variant={"outline"}
                  size={"icon-sm"}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                  <Italic />
                </Button>
                <Button
                  className={cn("", isUnderline && "bg-accent/50")}
                  variant={"outline"}
                  size={"icon-sm"}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                  <Underline />
                </Button>
                <Button
                  className={cn("", isLink && "bg-accent/50")}
                  variant={"outline"}
                  size={"icon-sm"}
                  onClick={() =>
                    useLinkDialogStore
                      .getState()
                      .openDialog(editor, editor.state.selection, {
                        defaultUrl: linkUrl,
                        defaultText: selectedText,
                      })
                  }
                >
                  <Link />
                </Button>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size={"sm"}
                      variant={"outline"}
                      className="dark:text-indigo-400 text-indigo-500 hover:text-indigo-600 rounded-full"
                    >
                      <Sparkle className="" />
                      Generate
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuPortal
                    container={bubbleMenuContainerRef.current}
                  >
                    <DropdownMenuPrimitive.Content
                      sideOffset={4}
                      className="bg-accent mt-1 ml-5 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md"
                      onCloseAutoFocus={(e) => {
                        e.preventDefault();
                      }}
                    >
                      <DropdownMenuPrimitive.Item
                        className="focus:bg-accent-foreground/10 relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent-foreground/10"
                        onClick={(e) => {
                          // Generate Content logic here
                          handleSetAiGenerateOption("content");
                        }}
                      >
                        <Sparkle className="text-indigo-500 size-4" />
                        Generate Content
                      </DropdownMenuPrimitive.Item>
                      <DropdownMenuPrimitive.Item
                        className="focus:bg-accent-foreground/10 relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent-foreground/10"
                        onClick={(e) => {
                          e.preventDefault();
                          // Generate Flash Cards logic here
                          handleSetAiGenerateOption("flash-cards");
                        }}
                      >
                        <SwatchBook className="text-orange-500 size-4" />
                        Generate Flash Cards
                      </DropdownMenuPrimitive.Item>
                      <DropdownMenuPrimitive.Item
                        className="focus:bg-accent-foreground/10 relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent-foreground/10"
                        onClick={(e) => {
                          e.preventDefault();
                          // Generate MCQs logic here
                          handleSetAiGenerateOption("mcqs");
                        }}
                      >
                        <ListCheck className="text-green-500 size-4" />
                        Generate MCQs
                      </DropdownMenuPrimitive.Item>
                      <DropdownMenuPrimitive.Item
                        className="focus:bg-accent-foreground/10 relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent-foreground/10"
                        onClick={(e) => {
                          e.preventDefault();
                          // Generate Open-Ended logic here
                          handleSetAiGenerateOption("open-ended");
                        }}
                      >
                        <PenBox className="text-yellow-500 size-4" />
                        Generate Open-Ended
                      </DropdownMenuPrimitive.Item>
                    </DropdownMenuPrimitive.Content>
                  </DropdownMenuPortal>
                </DropdownMenu>
              </ButtonGroup>
            </ButtonGroup>

            {/* {isTable && <>Table</>} */}
          </>
        )}
        {aiGenerateOption && (
          <BubbleAIGenerateInput option={aiGenerateOption} editor={editor} />
        )}
      </motion.div>

      <Dialog open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
        <DialogContent className="sm:max-w-[320px]">
          <DialogHeader>
            <DialogTitle>Custom Highlight Color</DialogTitle>
          </DialogHeader>
          <ColorPicker
            defaultValue={highlightColor || "#fef08a"}
            onChange={(rgba) => {
              customColorRef.current = rgba as [number, number, number, number];
            }}
            className="gap-3"
          >
            <ColorPickerSelection className="h-32 rounded-lg" />
            <ColorPickerHue />
            <ColorPickerAlpha />
            <div className="flex items-center gap-2">
              <ColorPickerEyeDropper />
              <ColorPickerOutput />
              <ColorPickerFormat className="flex-1" />
            </div>
          </ColorPicker>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setColorPickerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const hexColor = Color.rgb(
                  customColorRef.current[0],
                  customColorRef.current[1],
                  customColorRef.current[2]
                ).hex();
                editor.chain().focus().setHighlight({ color: hexColor }).run();
                setColorPickerOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </BubbleMenu>
  );
}
