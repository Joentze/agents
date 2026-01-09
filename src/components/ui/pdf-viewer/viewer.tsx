"use client";
import React, { useState, useCallback } from "react";
import { Worker, Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { searchPlugin } from "@react-pdf-viewer/search";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { fullScreenPlugin } from "@react-pdf-viewer/full-screen";
import { getFilePlugin } from "@react-pdf-viewer/get-file";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/search/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import "@react-pdf-viewer/full-screen/lib/styles/index.css";

import { PDFToolbar } from "./toolbar";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { Button } from "../button";

interface PDFViewerProps {
  fileUrl: string;
  fileName?: string;
  onClose: () => void;
  isRight: boolean;
  onSwap: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  fileName = "document.pdf",
  onClose,
  onSwap,
  isRight,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Initialize plugins
  const searchPluginInstance = searchPlugin({});
  const zoomPluginInstance = zoomPlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const fullScreenPluginInstance = fullScreenPlugin();
  const getFilePluginInstance = getFilePlugin({
    fileNameGenerator: () => fileName,
  });

  const handleDocumentLoad = useCallback((e: { doc: { numPages: number } }) => {
    setTotalPages(e.doc.numPages);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((e: { currentPage: number }) => {
    setCurrentPage(e.currentPage + 1);
  }, []);

  return (
    <Worker workerUrl="/pdf.worker.min.js">
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.2 }}
        className="sticky top-0 pdf-viewer-container h-full flex flex-col-reverse animate-fade-in "
      >
        <Button
          size={"icon"}
          className="rounded-full text-muted-foreground absolute top-0 right-0 m-4 z-3 border border-border ring-2 ring-border/50"
          variant={"secondary"}
          onClick={onClose}
        >
          <X />
        </Button>
        <PDFToolbar
          onSwap={onSwap}
          isRight={isRight}
          onClose={onClose}
          filename={fileName}
          currentPage={currentPage}
          totalPages={totalPages}
          isSearchOpen={isSearchOpen}
          onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
          searchPluginInstance={searchPluginInstance}
          zoomPluginInstance={zoomPluginInstance}
          pageNavigationPluginInstance={pageNavigationPluginInstance}
          fullScreenPluginInstance={fullScreenPluginInstance}
          getFilePluginInstance={getFilePluginInstance}
        />

        <div className="pdf-document-area flex-1 overflow-hidden">
          <Viewer
            fileUrl={fileUrl}
            plugins={[
              searchPluginInstance,
              zoomPluginInstance,
              pageNavigationPluginInstance,
              fullScreenPluginInstance,
              getFilePluginInstance,
            ]}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
            defaultScale={SpecialZoomLevel.PageWidth}
          />
        </div>
      </motion.div>
    </Worker>
  );
};
