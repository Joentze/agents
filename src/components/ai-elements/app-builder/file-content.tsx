import { memo } from "react";
import { CodeBlock } from "../code-block";
import { Loader } from "lucide-react";

interface FileContentProps {
  code: string;
  filename: string;
  isLoading: boolean;
}

const extensionToLanguage = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  css: "css",
  html: "html",
};

export const FileContent = memo(
  function FileContent({ code, filename, isLoading }: FileContentProps) {
    if (isLoading) {
      return (
        <div className="absolute w-full h-full flex items-center text-center">
          <div className="flex-1">
            <Loader size={8} className="animate-spin" />
          </div>
        </div>
      );
    }

    return (
      <CodeBlock
        showLineNumbers
        className="border-none"
        code={code}
        language={
          extensionToLanguage[
            filename.split(".").pop() as keyof typeof extensionToLanguage
          ] || "typescript"
        }
      />
    );
  },
  (nextProps, prevProps) => {
    return nextProps.code === prevProps.code;
  }
);
