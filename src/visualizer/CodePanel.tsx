import { useEffect, useRef } from "react";

interface Props {
  lines: string[];
  highlightLines: number[];
  activeSection: "ensure" | "process" | "schedule" | null;
}

const SECTION_RANGES: Record<string, [number, number]> = {
  ensure: [0, 37],
  process: [39, 80],
  schedule: [82, 131],
};

const SECTION_COLORS: Record<string, string> = {
  ensure: "rgba(77, 159, 255, 0.06)",
  process: "rgba(0, 232, 157, 0.06)",
  schedule: "rgba(255, 170, 44, 0.06)",
};

export default function CodePanel({ lines, highlightLines, activeSection }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (highlightLines.length > 0) {
      const mid = highlightLines[Math.floor(highlightLines.length / 2)];
      lineRefs.current[mid]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightLines]);

  const highlightSet = new Set(highlightLines);

  // Determine section background for each line
  const getLineBg = (i: number): string | undefined => {
    if (highlightSet.has(i)) return "rgba(77, 159, 255, 0.18)";
    if (activeSection) {
      const range = SECTION_RANGES[activeSection];
      if (range && i >= range[0] && i <= range[1]) {
        return SECTION_COLORS[activeSection];
      }
    }
    return undefined;
  };

  return (
    <div className="code-panel" ref={containerRef}>
      {lines.map((line, i) => {
        const isHighlighted = highlightSet.has(i);
        const isSectionHeader = line.startsWith("// ═══");
        return (
          <div
            key={i}
            ref={(el) => { lineRefs.current[i] = el; }}
            className={`code-line ${isHighlighted ? "highlighted" : ""}`}
            style={{
              background: getLineBg(i),
              ...(isSectionHeader ? { color: "var(--text-dim)", fontWeight: 700 } : {}),
            }}
          >
            <span className="code-line-number">{i + 1}</span>
            <span className="code-line-content">{line}</span>
          </div>
        );
      })}
    </div>
  );
}
