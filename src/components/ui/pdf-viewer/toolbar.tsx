"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import type { SearchPlugin } from "@react-pdf-viewer/search";
import type { ZoomPlugin } from "@react-pdf-viewer/zoom";
import type { PageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import type { FullScreenPlugin } from "@react-pdf-viewer/full-screen";
import type { GetFilePlugin } from "@react-pdf-viewer/get-file";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Maximize,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  EllipsisVertical,
} from "lucide-react";
import { ButtonGroup } from "../button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../input-group";
import { cn } from "@/lib/utils";

interface PDFToolbarProps {
  onClose: () => void;
  filename: string;
  currentPage: number;
  totalPages: number;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
  searchPluginInstance: SearchPlugin;
  zoomPluginInstance: ZoomPlugin;
  pageNavigationPluginInstance: PageNavigationPlugin;
  fullScreenPluginInstance: FullScreenPlugin;
  getFilePluginInstance: GetFilePlugin;
}

export const PDFToolbar: React.FC<PDFToolbarProps> = ({
  onClose,
  filename,
  currentPage,
  totalPages,
  isSearchOpen,
  onToggleSearch,
  searchPluginInstance,
  zoomPluginInstance,
  pageNavigationPluginInstance,
  fullScreenPluginInstance,
  getFilePluginInstance,
}) => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    ZoomIn: ZoomInButton,
    ZoomOut: ZoomOutButton,
    CurrentScale,
  } = zoomPluginInstance;
  const { GoToNextPage, GoToPreviousPage } = pageNavigationPluginInstance;
  const { EnterFullScreen } = fullScreenPluginInstance;
  const { Download: DownloadButton } = getFilePluginInstance;
  const {
    Search: SearchDialog,
    highlight,
    clearHighlights,
    jumpToNextMatch,
    jumpToPreviousMatch,
  } = searchPluginInstance;

  const performSearch = async (keyword: string) => {
    if (keyword.trim()) {
      // Clear previous highlights first
      clearHighlights();

      // Highlight all matches for the keyword
      const matches = await highlight({
        keyword,
        matchCase: false,
      });

      setMatchCount(matches.length);
      console.log(`Found ${matches.length} matches for "${keyword}"`);

      // Automatically jump to first match if found
      if (matches.length > 0) {
        setCurrentMatch(1);
        jumpToNextMatch();
      } else {
        setCurrentMatch(0);
      }
    } else {
      clearHighlights();
      setMatchCount(0);
      setCurrentMatch(0);
    }
  };

  const handleSearch = useCallback((keyword: string) => {
    setSearchKeyword(keyword);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(keyword);
    }, 500);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleNextMatch = () => {
    jumpToNextMatch();
    if (matchCount > 0) {
      setCurrentMatch((prev) => (prev >= matchCount ? 1 : prev + 1));
    }
  };

  const handlePreviousMatch = () => {
    jumpToPreviousMatch();
    if (matchCount > 0) {
      setCurrentMatch((prev) => (prev <= 1 ? matchCount : prev - 1));
    }
  };

  const handleCloseSearch = () => {
    onToggleSearch();
    setSearchKeyword("");
    clearHighlights();
    setMatchCount(0);
    setCurrentMatch(0);
  };

  return (
    <div className="flex flex-row gap-1 p-2 border-b border-border bg-accent/50 justify-between">
      {/* Left Section - Document Info */}

      <span className="text-md font-medium hidden sm:inline text-muted-foreground text-ellipsis overflow-hidden whitespace-nowrap p-2">
        {filename}
      </span>
      <div className="flex gap-1">
        {/* Page Navigation */}
        <ButtonGroup className="my-auto rounded-full">
          <GoToPreviousPage>
            {(props) => (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    size="icon"
                    onClick={props.onClick}
                    disabled={props.isDisabled}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous Page</TooltipContent>
              </Tooltip>
            )}
          </GoToPreviousPage>

          <Input
            readOnly
            className="w-16 text-center"
            value={`${currentPage}/${totalPages}`}
          />

          <GoToNextPage>
            {(props) => (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={props.onClick}
                    disabled={props.isDisabled}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next Page</TooltipContent>
              </Tooltip>
            )}
          </GoToNextPage>
        </ButtonGroup>

        {/* Right Section - Zoom & Actions */}

        {/* Zoom Controls */}

        <ButtonGroup className="my-auto rounded-full">
          <ZoomOutButton>
            {(props) => (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={props.onClick}
                    className="rounded-full"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
            )}
          </ZoomOutButton>

          <CurrentScale>
            {(props) => (
              <Input
                className="text-sm font-medium w-16 text-center"
                value={`${Math.round(props.scale * 100)}%`}
              />
            )}
          </CurrentScale>

          <ZoomInButton>
            {(props) => (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={props.onClick}
                    className="rounded-full"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
            )}
          </ZoomInButton>
        </ButtonGroup>

        <ButtonGroup>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full my-auto text-muted-foreground"
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <EnterFullScreen>
                {(props) => (
                  <DropdownMenuItem className="" onClick={props.onClick}>
                    <Maximize className="h-4 w-4" /> Go Fullscreen
                  </DropdownMenuItem>
                )}
              </EnterFullScreen>

              <DownloadButton>
                {(props) => (
                  <DropdownMenuItem className="" onClick={props.onClick}>
                    <Download className="h-4 w-4" /> Download Document
                  </DropdownMenuItem>
                )}
              </DownloadButton>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "rounded-full text-muted-foreground my-auto",
                  currentMatch > 0 &&
                    "bg-accent border border-border ring-2 ring-border/50"
                )}
                onClick={onToggleSearch}
              >
                <Search />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="p-2 space-y-2">
                <ButtonGroup className="w-full">
                  <InputGroup>
                    <InputGroupInput
                      type="text"
                      className="rounded-sm focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                      placeholder="Search in document..."
                      value={searchKeyword}
                      onChange={(e) => handleSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleNextMatch();
                        }
                      }}
                      autoFocus
                    />
                    <InputGroupAddon align="inline-end">
                      {currentMatch > 0 ? `${currentMatch}/${matchCount}` : ""}
                    </InputGroupAddon>
                  </InputGroup>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousMatch}
                    disabled={matchCount === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextMatch}
                    disabled={matchCount === 0}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCloseSearch}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </ButtonGroup>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </div>
    </div>
  );
};
