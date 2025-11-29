import { memo, useEffect } from "react";
import { CodeBlock } from "../code-block";
import { Loader } from "lucide-react";
import { useAppBuilder } from "@/hooks/app-builder/use-app-builder";
import { CodeEditor } from "@/components/ui/code-editor";
// import Editor from "@monaco-editor/react";
interface FileContentProps {
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

export const FileContent = memo(function FileContent() {
  const { currentPath, files } = useAppBuilder();
  if (currentPath === undefined) {
    return (
      <div className="absolute w-full h-full flex items-center text-center">
        <div className="flex-1">
          <Loader size={8} className="animate-spin" />
        </div>
      </div>
    );
  }

  return (
    // <CodeBlock
    //   showLineNumbers
    //   className="border-none"
    //   code={files[currentPath]}
    //   language={
    //     extensionToLanguage[
    //       currentPath.split(".").pop() as keyof typeof extensionToLanguage
    //     ] || "typescript"
    //   }
    // />
    <CodeEditor
      value={files[currentPath]}
      language={
        extensionToLanguage[
          currentPath.split(".").pop() as keyof typeof extensionToLanguage
        ] || "typescript"
      }
    />
    // <Editor
    //   width="100%"
    //   theme="vs-dark"
    //   language={
    //     extensionToLanguage[
    //       currentPath.split(".").pop() as keyof typeof extensionToLanguage
    //     ] || "typescript"
    //   }
    //   value={files[currentPath]}
    //   options={{
    //     minimap: {
    //       enabled: false,
    //     },
    //   }}
    //   path="App.tsx"
    //   beforeMount={(monaco) => {
    //     // Configure TypeScript/JavaScript to recognize JSX
    //     monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    //       jsx: monaco.languages.typescript.JsxEmit.React,
    //       allowNonTsExtensions: true,
    //       target: monaco.languages.typescript.ScriptTarget.Latest,
    //       lib: ["es2020", "dom"],
    //       allowJs: true,
    //     });
    //     // monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    //     //   jsx: monaco.languages.typescript.JsxEmit.React,
    //     //   jsxFactory: "React.createElement",
    //     //   reactNamespace: "React",
    //     //   allowNonTsExtensions: true,
    //     //   allowJs: true,
    //     // });
    //   }}
    // />
  );
});
