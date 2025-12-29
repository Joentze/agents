export default function ArtifactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-full flex flex-col h-screen overflow-y-auto">
      {children}
    </div>
  );
}
