import { ScanlineOverlay } from "@/components/ui/scanline-overlay";

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-void">
      <ScanlineOverlay />
      {children}
    </div>
  );
}
