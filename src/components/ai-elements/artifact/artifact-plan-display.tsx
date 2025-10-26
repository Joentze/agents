import { ArtifactInput } from "@/app/types/artifact";
import { Plan, PlanDescription, PlanHeader, PlanTitle } from "../plan";

import { motion } from "motion/react";
import { useArtifactStore } from "@/hooks/artifact/use-artifact";

interface ArtifactPlanDisplayProps {
  id: string;
  artifact: ArtifactInput;
  isLoading: boolean;
}

function ArtifactPlanDisplay({
  id,
  artifact,
  isLoading,
}: ArtifactPlanDisplayProps) {
  const { setCurrentArtifact } = useArtifactStore();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="p-[1px]"
      onClick={() => {
        setCurrentArtifact(id);
      }}
    >
      <Plan
        defaultOpen={false}
        isStreaming={isLoading}
        className="p-4 w-full border border-border hover:bg-accent/30 cursor-pointer transition-all duration-200"
      >
        <PlanHeader className="-px-2">
          <div>
            <PlanTitle>{artifact?.title}</PlanTitle>
            <PlanDescription className="line-clamp-1 mt-1 -mb-1">
              {artifact?.description}
            </PlanDescription>
          </div>
          {/* <PlanTrigger /> */}
        </PlanHeader>
        {/* <PlanContent className="-px-2 max-h-64 overflow-y-auto shadow-b-inner ">
          <div className="space-y-4 text-sm text-muted-foreground">
            <Response>{`## Outline` + "\n" + artifact.plan}</Response>
          </div>
        </PlanContent> */}
        {/* <PlanFooter className="-px-2 flex justify-end py-1">
          <Button
            disabled={isLoading}
            size="sm"
            className="border border-border ring-1 ring-border/50"
          >
            {isLoading && <Loader />}
            {!isLoading && <EyeIcon />}
            {isLoading ? "Writing..." : "View Artifact"}
          </Button>
        </PlanFooter> */}
      </Plan>
    </motion.div>
  );
}
export { ArtifactPlanDisplay };
