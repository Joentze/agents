type ArtifactPartType = "text" | "custom-component";

type ArtifactInput = {
  title: string;
  description: string;
  plan: string;
};

type ArtifactStart = { id: string } & ArtifactInput;

type ArtifactPart = {
  type: ArtifactPartType;
  content: string;
};
export type { ArtifactInput, ArtifactPart, ArtifactPartType, ArtifactStart };
