import { X } from "lucide-react";

import type { CatStats } from "@/lib/quantum/cat";

import { Tex } from "./Tex";

interface CatEvolutionPanelProps {
  stats: Array<CatStats | undefined>;
  activeIndex: number;
  onClose: () => void;
}

const W = 340;
const H = 110;
const PAD = { left: 34, right: 10, top: 8, bottom: 18 };

interface Series {
  key: "parity" | "meanPhotons";
  label: string;
  color: string;
  digits: number;
  range: (values: number[]) => [number, number];
}

const SERIES: Series[] = [
  {
    key: "parity",
    label: String.raw`\langle \hat \Pi\rangle`,
    color: "#0d3da8",
    digits: 4,
    range: () => [-1, 1],
  },
  {
    key: "meanPhotons",
    label: String.raw`\langle \hat a^\dagger \hat a\rangle`,
    color: "#b8141c",
    digits: 3,
    range: (values) => [0, Math.max(1e-6, ...values)],
  },
];

function Chart({
  series,
  points,
  tMax,
  activeTime,
  showTimeAxis,
}: {
  series: Series;
  points: CatStats[];
  tMax: number;
  activeTime: number | null;
  showTimeAxis: boolean;
}) {
  const [lo, hi] = series.range(points.map((p) => p[series.key]));
  const span = Math.max(1e-6, hi - lo);
  const x = (t: number) => PAD.left + (t / tMax) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - lo) / span) * (H - PAD.top - PAD.bottom);
  const ticks = [lo, lo + span / 2, hi];
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.time).toFixed(1)},${y(p[series.key]).toFixed(1)}`)
    .join(" ");

  return (
    <svg width={W} height={H} role="img" aria-label={`${series.key} over time`}>
      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(v)}
            y2={y(v)}
            stroke="currentColor"
            className="text-border"
            strokeWidth={1}
          />
          <text
            x={PAD.left - 4}
            y={y(v) + 3}
            textAnchor="end"
            className="fill-muted-foreground font-mono"
            fontSize={8}
          >
            {v.toFixed(series.key === "parity" ? 1 : 2)}
          </text>
        </g>
      ))}
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={H - PAD.bottom}
        y2={H - PAD.bottom}
        stroke="currentColor"
        className="text-foreground"
        strokeWidth={1}
      />
      {showTimeAxis && (
        <>
          <text
            x={W - PAD.right}
            y={H - PAD.bottom + 13}
            textAnchor="end"
            className="fill-muted-foreground font-mono"
            fontSize={8}
          >
            t = {tMax.toFixed(2)}
          </text>
          <text x={PAD.left} y={H - PAD.bottom + 13} className="fill-muted-foreground font-mono" fontSize={8}>
            0
          </text>
        </>
      )}
      <path d={path} fill="none" stroke={series.color} strokeWidth={1.6} />
      {points.length === 1 && points[0] && (
        <circle cx={x(points[0].time)} cy={y(points[0][series.key])} r={2.5} fill={series.color} />
      )}
      {activeTime !== null && (
        <line
          x1={x(activeTime)}
          x2={x(activeTime)}
          y1={PAD.top}
          y2={H - PAD.bottom}
          stroke="currentColor"
          className="text-foreground"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}
    </svg>
  );
}

export function CatEvolutionPanel({ stats, activeIndex, onClose }: CatEvolutionPanelProps) {
  const points = stats.filter((s): s is CatStats => Boolean(s));
  const tMax = Math.max(1e-6, ...points.map((s) => s.time));
  const active = stats[activeIndex];

  return (
    <div className="pointer-events-auto absolute top-3 left-3 z-10 rounded-md border border-border bg-card/95 p-2 shadow-sm backdrop-blur">
      <div className="mb-1 flex items-center gap-2">
        <h3 className="text-[0.6rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Parity and photons vs time
        </h3>
        <button
          onClick={onClose}
          aria-label="Close parity and photon plot"
          className="ml-auto rounded border border-border p-0.5 text-muted-foreground transition-colors hover:bg-accent"
        >
          <X className="size-2.5" />
        </button>
      </div>

      {SERIES.map((s, i) => (
        <div key={s.key}>
          <div className="flex items-center gap-1 text-[0.62rem]">
            <span className="inline-block h-0.5 w-3" style={{ backgroundColor: s.color }} />
            <Tex className="text-muted-foreground">{s.label}</Tex>
            <span className="text-foreground">{active ? active[s.key].toFixed(s.digits) : "—"}</span>
          </div>
          <Chart
            series={s}
            points={points}
            tMax={tMax}
            activeTime={active ? active.time : null}
            showTimeAxis={i === SERIES.length - 1}
          />
        </div>
      ))}
    </div>
  );
}
