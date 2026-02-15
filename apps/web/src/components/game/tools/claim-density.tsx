"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import type { PageSection } from "@/lib/types";

interface ClaimDensityProps {
    sections: PageSection[];
}

// Patterns that indicate specific factual claims
const CLAIM_PATTERNS = [
    /\d+(\.\d+)?%/g,                            // Percentages: 72%, 3.5%
    /\$[\d,.]+\s*(billion|million|trillion)?/gi, // Dollar amounts
    /\b\d{4}\b/g,                                // Years: 2024, 1982
    /\d+(\.\d+)?\s*(billion|million|trillion|thousand|hundred)/gi, // Large numbers
    /\b\d+(\.\d+)?\s*°?[A-Z][a-z]?\b/g,         // Numbers with units: -23°C, 250K, 10km
    /\b\d+(\.\d+)?\s*(times|percent|degrees|hours|days|years old|meters|miles|kg|lbs|watts)/gi,
    /\b(study|research|report|survey|analysis|experiment|trial|peer review)\b/gi,
    /\b(according to|found that|estimated|approximately|reported|confirmed|discovered|demonstrated|achieved|published)\b/gi,
    /\b(Dr\.|Professor|Institute|University|Organization|Foundation|Association|Agency|Ministry|Laboratory)\b/g,
    /\b(first|largest|smallest|fastest|most|least|only|record|unprecedented)\b/gi, // Superlative claims
];

function countClaims(text: string): number {
    const seen = new Set<string>();
    let total = 0;

    for (const pattern of CLAIM_PATTERNS) {
        // Reset lastIndex for global patterns
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text)) !== null) {
            // Deduplicate overlapping matches by position
            const key = `${match.index}-${match[0]}`;
            if (!seen.has(key)) {
                seen.add(key);
                total++;
            }
        }
    }

    return total;
}

function getDensityLabel(claims: number): {
    label: string;
    color: string;
    iconColor: string;
    warning: boolean;
} {
    if (claims >= 5) {
        return {
            label: "Very High",
            color: "text-decay",
            iconColor: "text-decay",
            warning: true,
        };
    }
    if (claims >= 3) {
        return {
            label: "High",
            color: "text-amber",
            iconColor: "text-amber",
            warning: true,
        };
    }
    if (claims >= 1) {
        return {
            label: "Normal",
            color: "text-text-secondary",
            iconColor: "text-archive",
            warning: false,
        };
    }
    return {
        label: "Low",
        color: "text-text-ghost",
        iconColor: "text-archive",
        warning: false,
    };
}

export function ClaimDensity({ sections }: ClaimDensityProps) {
    const analysis = useMemo(() => {
        return sections.map((section) => {
            const claims = countClaims(section.text);
            const preview =
                section.text.length > 55
                    ? section.text.slice(0, 55).replace(/\s+\S*$/, "") + "…"
                    : section.text;
            return { id: section.id, claims, preview, ...getDensityLabel(claims) };
        });
    }, [sections]);

    const highDensityCount = analysis.filter((a) => a.warning).length;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-text-secondary">
                    Claim Density by Section
                </span>
                <span
                    className={`font-mono text-xs font-bold ${highDensityCount > 0 ? "text-amber" : "text-archive"}`}
                >
                    {highDensityCount} flagged
                </span>
            </div>

            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {analysis.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-start gap-2 text-xs font-sans leading-relaxed"
                    >
                        {item.warning ? (
                            <AlertTriangle className={`h-3 w-3 shrink-0 mt-0.5 ${item.iconColor}`} />
                        ) : (
                            <CheckCircle className="h-3 w-3 text-archive shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                            <span className={`font-mono text-[10px] ${item.color}`}>
                                {item.claims} claims · {item.label}
                            </span>
                            <p className="text-text-ghost truncate">{item.preview}</p>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-xs text-text-ghost font-sans leading-relaxed">
                Sections with high claim density contain many specific facts, statistics,
                or references — verify these carefully.
            </p>
        </div>
    );
}
