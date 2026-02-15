"use client";

import { CheckCircle, XCircle } from "lucide-react";
import type { FactCheckData } from "@/lib/types";

interface CrossReferenceProps {
  data: FactCheckData;
}

export function CrossReference({ data }: CrossReferenceProps) {
  const hits = data.crossReferenceHits;

  return (
    <div className="space-y-2">
      <span className="font-mono text-xs text-text-secondary">
        Cross-Reference Results ({hits.length})
      </span>

      <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
        {hits.map((hit, i) => {
          // Heuristic: hits containing "accurate", "real", "correct" are supporting
          const isSupporting = /accurate|real|correct|true|well-documented|widely cited|legitimate/i.test(hit);

          return (
            <div
              key={i}
              className="flex items-start gap-2 text-xs font-sans leading-relaxed"
            >
              {isSupporting ? (
                <CheckCircle className="h-3 w-3 text-archive shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-3 w-3 text-decay shrink-0 mt-0.5" />
              )}
              <span className="text-text-secondary">{hit}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
