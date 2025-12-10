"use client";

import dynamic from "next/dynamic";

export const PDFViewer = dynamic(
  () => import("./viewer").then((mod) => ({ default: mod.PDFViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading PDF viewer...</p>
        </div>
      </div>
    ),
  }
);
