type ChainOfThoughtStepType =
  | "search"
  | "text"
  | "image"
  | "code"
  | "date"
  | "writing"
  | "component"
  | "data-analysis";

type SearchStep = {
  query: string;
  results: { url: string; title: string; text: string }[];
};
type DateStep = {
  date: string;
};
type TextStep = {
  text: string;
};

type ImageStep = {
  image: string;
};

type WritingStep = {
  content: string;
};

type CodeStep = {
  task: string;
  code: string;
  output: string | undefined;
};
type ComponentStep = {
  component: "flash-card" | undefined;
};

type StepData =
  | SearchStep
  | TextStep
  | ImageStep
  | DateStep
  | WritingStep
  | ComponentStep
  | CodeStep;

type ChainOfThoughtStep = {
  id: string;
  type: ChainOfThoughtStepType;
  startDatetime?: number;
  endDatetime?: number;
  data: StepData;
  status: RunStepStatus;
};

type ChainOfThoughtRunType =
  | "agentic-search"
  | "agentic-code"
  | "agentic-data-analysis"
  | "agentic-artifact";

type RunStepStatus = "pending" | "completed" | "error";
type ChainOfThoughtRun = {
  id: string;
  type: ChainOfThoughtRunType;
  startDatetime?: number;
  endDatetime?: number;
  steps: Record<string, ChainOfThoughtStep>;
  status: RunStepStatus;
};

type StepUpdateType = {
  status: RunStepStatus;
  type: ChainOfThoughtStepType;
  runId: string;
  stepId: string;
  data: StepData;
  startDatetime?: number;
  endDatetime?: number;
};

export type {
  ChainOfThoughtStep,
  ChainOfThoughtRun,
  StepUpdateType,
  ChainOfThoughtRunType,
  ChainOfThoughtStepType,
  SearchStep,
  TextStep,
  CodeStep,
  ImageStep,
  DateStep,
  WritingStep,
  ComponentStep,
};
