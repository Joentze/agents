"use client";
import { Database } from "@/app/types/database.types";
import { createContext, useContext } from "react";

const ArtifactDataContext = createContext<
  Database["public"]["Tables"]["artifact"]["Row"] | null
>(null);

export default function ArtifactProvider({
  children,
  artifact,
}: {
  artifact: Database["public"]["Tables"]["artifact"]["Row"];
  children: React.ReactNode;
}) {
  return (
    <ArtifactDataContext.Provider value={artifact}>
      {children}
    </ArtifactDataContext.Provider>
  );
}

export function useArtifactData() {
  const context = useContext(ArtifactDataContext);
  if (!context) {
    throw new Error("useArtifactData must be used within ArtifactProvider");
  }
  return context;
}
