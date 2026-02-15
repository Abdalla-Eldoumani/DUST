"use client";

import { CheckCircle, AlertTriangle } from "lucide-react";
import type { FactCheckData } from "@/lib/types";

interface DateCheckerProps {
  data: FactCheckData;
}

export function DateChecker({ data }: DateCheckerProps) {
  const isAccurate = data.dateAccuracy;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {isAccurate ? (
          <CheckCircle className="h-3.5 w-3.5 text-archive" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-decay" />
        )}
        <span
          className={`font-mono text-xs font-bold ${isAccurate ? "text-archive" : "text-decay"}`}
        >
          {isAccurate ? "Dates Consistent" : "Date Anomaly Detected"}
        </span>
      </div>

      <p className="text-xs text-text-ghost font-sans leading-relaxed">
        {isAccurate
          ? "Publication date and referenced events appear to be chronologically consistent. No anachronistic references detected."
          : "Timeline inconsistencies found. Referenced events do not align with the stated publication date. Possible fabrication or backdating."}
      </p>
    </div>
  );
}
