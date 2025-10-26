import {
  ChainOfThoughtRun,
  ChainOfThoughtRunType,
  ChainOfThoughtStepType,
  ComponentStep,
  DateStep,
  ImageStep,
  SearchStep,
  TextStep,
  WritingStep,
} from "@/app/types/chain-of-thought";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtImage,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "./chain-of-thought";
import {
  Box,
  Calendar,
  Code,
  Component,
  DotIcon,
  FileIcon,
  Globe,
  ImageIcon,
  LucideIcon,
  Pencil,
  Search,
} from "lucide-react";
import { Shimmer } from "./shimmer";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChainOfThoughtStore } from "@/hooks/chain-of-thought/use-chain-of-thought";

interface ChainOfThoughtDisplayProps {
  // tool call id
  runId: string;
}

type ChainOfThoughtDisplayHeaders = Record<
  ChainOfThoughtRunType,
  {
    icon: LucideIcon;
    beforeLabel: string;
    afterLabel: string;
  }
>;

type ChainOfThoughtDisplaySteps = Record<
  ChainOfThoughtStepType,
  {
    icon: LucideIcon;
  }
>;

const chainOfThoughtDisplaySteps: ChainOfThoughtDisplaySteps = {
  search: {
    icon: Search,
  },
  text: {
    icon: DotIcon,
  },
  image: {
    icon: ImageIcon,
  },
  code: {
    icon: Code,
  },
  date: {
    icon: Calendar,
  },
  writing: {
    icon: Pencil,
  },
  component: {
    icon: Component,
  },
};
const chainOfThoughtDisplayHeaders: ChainOfThoughtDisplayHeaders = {
  "agentic-search": {
    icon: Globe,
    beforeLabel: "Searching the Web",
    afterLabel: "Searched the Web",
  },
  "agentic-code": {
    icon: Code,
    beforeLabel: "Coding",
    afterLabel: "Coded",
  },
  "agentic-artifact": {
    icon: Box,
    beforeLabel: "Generating Artifact",
    afterLabel: "Generated Artifact",
  },
};

function SearchStepDisplay({ step }: { step: SearchStep }) {
  return (
    <ChainOfThoughtStep
      label={`Searching for ${step.query}`}
      icon={chainOfThoughtDisplaySteps.search.icon}
    >
      <ChainOfThoughtSearchResults>
        <TooltipProvider>
          {step.results.map(({ url, title }) => (
            <Tooltip key={url}>
              <TooltipTrigger asChild>
                <ChainOfThoughtSearchResult
                  className="border border-border cursor-pointer rounded-md p-1 ring-1 ring-border/50 bg-muted/50 truncate"
                  onClick={() => {
                    window.open(url, "_blank");
                  }}
                >
                  <Image
                    alt=""
                    className="size-4"
                    height={16}
                    src={`https://img.logo.dev/${new URL(url).hostname}?token=${
                      process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN
                    }`}
                    width={16}
                  />
                  {new URL(url).hostname}
                </ChainOfThoughtSearchResult>
              </TooltipTrigger>
              <TooltipContent>
                <p>{title}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </ChainOfThoughtSearchResults>
    </ChainOfThoughtStep>
  );
}

function ChainOfThoughtDisplay({ runId }: ChainOfThoughtDisplayProps) {
  const { runs } = useChainOfThoughtStore();
  const run = runs[runId];
  if (!run) {
    return null;
  }
  return (
    <>
      <ChainOfThought
        className="-mb-3"
        key={runId}
        defaultOpen={run.status === "completed" ? false : true}
      >
        <ChainOfThoughtHeader
          icon={chainOfThoughtDisplayHeaders[run.type].icon}
        >
          {run.status === "completed" ? (
            chainOfThoughtDisplayHeaders[run.type].afterLabel
          ) : (
            <Shimmer>
              {chainOfThoughtDisplayHeaders[run.type].beforeLabel}
            </Shimmer>
          )}
        </ChainOfThoughtHeader>
        <ChainOfThoughtContent className="pb-4">
          {Object.entries(run.steps).map(([stepId, step]) => {
            return (
              <>
                {step.type === "search" && (
                  <SearchStepDisplay
                    key={stepId}
                    step={step.data as SearchStep}
                  />
                )}
                {step.type === "text" && (
                  <>
                    {step.status === "completed" && (
                      <ChainOfThoughtStep
                        icon={chainOfThoughtDisplaySteps.text.icon}
                        label={`${(step.data as TextStep).text.slice(
                          0,
                          500
                        )}...`}
                      ></ChainOfThoughtStep>
                    )}
                    {step.status === "pending" && (
                      <ChainOfThoughtStep
                        icon={chainOfThoughtDisplaySteps.text.icon}
                        label={<Shimmer>Summarising</Shimmer>}
                      />
                    )}
                  </>
                )}
                {step.type === "writing" && (
                  <ChainOfThoughtStep
                    icon={chainOfThoughtDisplaySteps.writing.icon}
                    label={`${(step.data as WritingStep).content}`}
                  ></ChainOfThoughtStep>
                )}
                {step.type === "component" && (
                  <ChainOfThoughtStep
                    icon={chainOfThoughtDisplaySteps.component.icon}
                    label={
                      "Created " +
                      `${(step.data as ComponentStep).component}`
                        .split("-")
                        .join(" ")
                    }
                  ></ChainOfThoughtStep>
                )}
                {step.type === "date" && (
                  <ChainOfThoughtStep
                    icon={chainOfThoughtDisplaySteps.date.icon}
                    label={`${(step.data as DateStep).date}`}
                  ></ChainOfThoughtStep>
                )}
                {step.type === "image" && (
                  <ChainOfThoughtStep
                    icon={chainOfThoughtDisplaySteps.image.icon}
                    label={`Image`}
                  >
                    <ChainOfThoughtImage>
                      <Image
                        alt=""
                        className="size-full object-cover"
                        height={200}
                        src={(step.data as ImageStep).image}
                        width={200}
                      />
                    </ChainOfThoughtImage>
                  </ChainOfThoughtStep>
                )}
              </>
            );
          })}
        </ChainOfThoughtContent>
      </ChainOfThought>
    </>
  );
}

export default ChainOfThoughtDisplay;
