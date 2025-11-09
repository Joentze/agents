"use client";

import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FileIcon,
} from "lucide-react";
import {
  SiReact,
  SiHtml5,
  SiCss,
  SiJavascript,
  SiTypescript,
  SiJson,
} from "@icons-pack/react-simple-icons";

import { FileContent } from "./file-content";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  buildFileTree,
  type FileNode,
} from "@/components/ai-elements/app-builder/build-file-tree";
import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { File as CodeFile } from "@/hooks/app-builder/use-app-builder";

// Wrapper component to fetch and display file content from sandbox
const SandboxFileContent = memo(function SandboxFileContent({
  node,
}: {
  node: FileNode;
}) {
  return (
    <FileContent
      code={node.content ?? ""}
      filename={node.path}
      isLoading={!node.content}
    />
  );
});

interface Props {
  className: string;
  disabled?: boolean;
  paths: string[];
  files: Record<string, CodeFile>;
  currentPath: string | undefined;
}

export const FileExplorer = memo(
  function FileExplorer({
    className,
    disabled,
    paths,
    files,
    currentPath,
  }: Props) {
    const fileTree = useMemo(() => buildFileTree(paths, files), [paths, files]);

    const [selected, setSelected] = useState<FileNode | null>(null);
    const [fs, setFs] = useState<FileNode[]>(fileTree);

    useEffect(() => {
      setFs(fileTree);
    }, [fileTree]);

    const toggleFolder = useCallback((path: string) => {
      setFs((prev) => {
        const updateNode = (nodes: FileNode[]): FileNode[] =>
          nodes.map((node) => {
            if (node.path === path && node.type === "folder") {
              return { ...node, expanded: !node.expanded };
            } else if (node.children) {
              return { ...node, children: updateNode(node.children) };
            } else {
              return node;
            }
          });
        return updateNode(prev);
      });
    }, []);

    const selectFile = useCallback((node: FileNode) => {
      if (node.type === "file") {
        setSelected(node);
      }
    }, []);

    // Recursively search for a file node by path
    const findFileByPath = useCallback(
      (nodes: FileNode[], targetPath: string): FileNode | null => {
        for (const node of nodes) {
          // Check if current node matches (handle both full path and relative path)
          if (node.name === targetPath || targetPath.endsWith(node.name)) {
            return node;
          }
          // Recursively search in children if it's a folder
          if (node.type === "folder" && node.children) {
            const found = findFileByPath(node.children, targetPath);
            if (found) {
              return found;
            }
          }
        }
        return null;
      },
      []
    );

    useEffect(() => {
      console.log("fileTree", fileTree);
      console.log("currentPath", currentPath);
      if (currentPath) {
        const currentFile = findFileByPath(fileTree, currentPath);
        console.log("currentFile", currentFile);
        if (currentFile && currentFile.type === "file") {
          setSelected(currentFile);
        }
      }
    }, [currentPath, fileTree, findFileByPath]);

    const renderFileTree = useCallback(
      (nodes: FileNode[], depth = 0) => {
        return nodes.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            depth={depth}
            selected={selected}
            onToggleFolder={toggleFolder}
            onSelectFile={selectFile}
            renderFileTree={renderFileTree}
          />
        ));
      },
      [selected, toggleFolder, selectFile]
    );

    return (
      <div className={cn("", className)}>
        <ResizablePanelGroup direction="horizontal" className="text-sm">
          <ResizablePanel defaultSize={25} minSize={15} className="pt-1">
            <ScrollArea className="">
              <div>{renderFileTree(fs)}</div>
            </ScrollArea>
          </ResizablePanel>

          <ResizableHandle />
          <ResizablePanel defaultSize={75}>
            {selected && !disabled && (
              <>
                <div className="h-full overflow-auto">
                  <FileContent
                    code={selected.content ?? ""}
                    filename={selected.path}
                    isLoading={false}
                  />
                </div>
              </>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  },
  (nextProps, prevProps) => {
    return nextProps.paths === prevProps.paths;
  }
);

const extensionToIcon = {
  ts: <SiTypescript className="size-4 mr-2" color="#3178C6" />,
  tsx: <SiReact className="size-4 mr-2" color="#61DAFB" />,
  js: <SiJavascript className="size-4 mr-2" color="#F7DF1E" />,
  jsx: <SiReact className="size-4 mr-2" color="#61DAFB" />,
  json: <SiJson className="size-4 mr-2" color="#5A5A5A" />,
  css: <SiCss className="size-4 mr-2" color="#1572B6" />,
  html: <SiHtml5 className="size-4 mr-2" color="#E34F26" />,
};

// Memoized file tree node component
const FileTreeNode = memo(function FileTreeNode({
  node,
  depth,
  selected,
  onToggleFolder,
  onSelectFile,
  renderFileTree,
}: {
  node: FileNode;
  depth: number;
  selected: FileNode | null;
  onToggleFolder: (path: string) => void;
  onSelectFile: (node: FileNode) => void;
  renderFileTree: (nodes: FileNode[], depth: number) => React.ReactNode;
}) {
  const handleClick = useCallback(() => {
    if (node.type === "folder") {
      onToggleFolder(node.path);
    } else {
      onSelectFile(node);
    }
  }, [node, onToggleFolder, onSelectFile]);
  const extension = node.path.split(".").pop();
  return (
    <div>
      <div
        className={cn(
          `flex items-center py-0.5 px-1 hover:bg-muted cursor-pointer`,
          { "bg-muted/50": selected?.path === node.path }
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === "folder" ? (
          <>
            {node.expanded ? (
              <ChevronDownIcon className="w-4 mr-1" />
            ) : (
              <ChevronRightIcon className="w-4 mr-1" />
            )}
            <FolderIcon className="w-4 mr-2" />
          </>
        ) : (
          <>
            <div className="w-4 mr-1" />

            {Object.keys(extensionToIcon).includes(
              extension as keyof typeof extensionToIcon
            ) ? (
              extensionToIcon[extension as keyof typeof extensionToIcon]
            ) : (
              <FileIcon className="w-4 mr-2 " />
            )}
          </>
        )}
        <span className="">{node.name}</span>
      </div>

      {node.type === "folder" && node.expanded && node.children && (
        <div>{renderFileTree(node.children, depth + 1)}</div>
      )}
    </div>
  );
});
