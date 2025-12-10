export default function ArtifactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return <div className="w-full flex flex-col h-screen">{children}</div>;
}
