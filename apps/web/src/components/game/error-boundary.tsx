"use client";

import { Component, type ReactNode } from "react";
import { GlowText } from "@/components/ui/glow-text";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[200px] items-center justify-center p-8">
          <div className="text-center max-w-md">
            <GlowText
              as="div"
              color="red"
              intensity="medium"
              className="font-mono text-sm uppercase tracking-wider mb-2"
            >
              DATA CORRUPTION DETECTED
            </GlowText>
            <p className="font-sans text-xs text-text-ghost mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-1.5 font-mono text-xs uppercase tracking-wider bg-scan/10 text-scan border border-scan/30 hover:bg-scan/20 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
