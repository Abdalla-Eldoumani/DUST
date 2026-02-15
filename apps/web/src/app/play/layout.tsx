import { ScanlineOverlay } from "@/components/ui/scanline-overlay";
import { GameErrorBoundary } from "@/components/game/error-boundary";

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-svh overflow-x-hidden bg-void">
      <ScanlineOverlay />
      <GameErrorBoundary>{children}</GameErrorBoundary>
    </div>
  );
}
