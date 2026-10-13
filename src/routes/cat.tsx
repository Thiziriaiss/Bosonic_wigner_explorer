import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";

import { CatControlPanel } from "@/components/wigner/CatControlPanel";
import { CatEvolutionPanel } from "@/components/wigner/CatEvolutionPanel";
import { Tex } from "@/components/wigner/Tex";

import { useCatSimulation } from "@/hooks/useCatSimulation";
import { CAT_ALPHA, CAT_CUTOFF, type CatGate } from "@/lib/quantum/cat";
import { PHASE_LIMIT, TIME_WINDOW } from "@/lib/quantum/protocol";
import type { Lattice, LogicalState } from "@/lib/quantum/state";

const WignerScene = lazy(() => import("@/components/wigner/WignerScene"));

// Unit reference grid on the floor (the scene draws lines at half-lattice vectors).
const UNIT_GRID: Lattice = { l1: [2, 0], l2: [0, 2], rows: false };

export const Route = createFileRoute("/cat")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cat Qubit Explorer — 3D Wigner function of a cat qubit" },
      {
        name: "description",
        content:
          "Interactive 3D Wigner function of the cat qubit code words: even and odd cats and their superpositions.",
      },
    ],
  }),
  component: CatPage,
});

function PlotFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <p className="font-mono text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function CatPage() {
  const [cutoff, setCutoff] = useState(CAT_CUTOFF);
  const [alpha, setAlpha] = useState(CAT_ALPHA);
  const [logical, setLogical] = useState<LogicalState>("0");
  const [panelWidth, setPanelWidth] = useState(304);
  const [gates, setGates] = useState<Array<CatGate>>([]);
  const [kappa1, setKappa1] = useState(0);
  const [kappaPhi, setKappaPhi] = useState(0);
  const [timeWindow, setTimeWindow] = useState(TIME_WINDOW);
  const [playing, setPlaying] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [showEvolution, setShowEvolution] = useState(false);

  const sim = useCatSimulation({ cutoff, alpha, logical, gates, kappa1, kappaPhi, timeWindow });
  const loadedFrames = sim.frames.filter(Boolean).length;

  useEffect(() => {
    setFrameIndex(0);
    setPlaying(kappa1 > 0 || kappaPhi > 0);
  }, [cutoff, alpha, logical, gates, kappa1, kappaPhi, timeWindow]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setFrameIndex((i) => {
        const next = i + 1;
        if (next >= sim.frameCount) return 0;
        return sim.frames[next] ? next : i;
      });
    }, 90);
    return () => window.clearInterval(timer);
  }, [playing, sim.frameCount, sim.frames]);

  const activeIndex = Math.min(frameIndex, Math.max(0, sim.frames.length - 1));
  const frame = sim.frames[activeIndex] ?? sim.frames[0] ?? null;
  const reference = useMemo(() => {
    const first = sim.frames[0];
    if (!first) return 0.32;
    return Math.max(Math.abs(first.stats.min), Math.abs(first.stats.max), 1e-6);
  }, [sim.frames]);

  // Keep the last rendered surface so the canvas (and camera) survives recomputes.
  const lastScene = useRef<{
    coords: Float64Array;
    values: Float64Array;
    size: number;
    reference: number;
  } | null>(null);
  if (sim.coords && frame) {
    lastScene.current = { coords: sim.coords, values: frame.values, size: sim.size, reference };
  }
  const scene = lastScene.current;

  return (
    <main className="flex min-h-screen flex-col bg-background md:h-screen md:flex-row md:overflow-hidden">
      <div className="relative h-[55vh] min-h-[320px] w-full md:h-screen md:min-h-0 md:w-0 md:min-w-0 md:flex-1 md:basis-0">
        <ClientOnly fallback={<PlotFallback label="preparing plot…" />}>
          <Suspense fallback={<PlotFallback label="loading renderer…" />}>
            {scene ? (
              <WignerScene
                coords={scene.coords}
                values={scene.values}
                size={scene.size}
                reference={scene.reference}
                limit={PHASE_LIMIT}
                lattice={UNIT_GRID}
                units="plain"
              />
            ) : (
              <PlotFallback label="building cat state…" />
            )}
          </Suspense>
        </ClientOnly>
        {showEvolution && (
          <CatEvolutionPanel
            stats={sim.frames.map((f) => f?.stats)}
            activeIndex={activeIndex}
            onClose={() => setShowEvolution(false)}
          />
        )}
        <div className="pointer-events-none absolute bottom-3 left-4 text-[0.72rem] text-muted-foreground">
          <Tex>{String.raw`W(q,p)\;\cdot\; q,p \in [-${PHASE_LIMIT}, +${PHASE_LIMIT}]\;\cdot\; \alpha = ${alpha.toFixed(2)}`}</Tex>
        </div>
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        title="Drag to resize the control column"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const startX = e.clientX;
          const startW = panelWidth;
          const move = (ev: PointerEvent) => {
            const next = startW - (ev.clientX - startX);
            setPanelWidth(Math.min(680, Math.max(240, next)));
          };
          const up = () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
          };
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", up);
        }}
        className="hidden shrink-0 cursor-col-resize items-center justify-center bg-border/60 transition-colors hover:bg-primary/60 md:flex md:w-1.5"
      >
        <span className="h-8 w-[2px] rounded bg-muted-foreground/40" />
      </div>
      <CatControlPanel
        width={panelWidth}
        alpha={alpha}
        onAlpha={setAlpha}
        cutoff={cutoff}
        onCutoff={setCutoff}
        logical={logical}
        onLogical={setLogical}
        gates={gates}
        onGate={(g) => setGates((prev) => [...prev, g])}
        onReset={() => setGates([])}
        kappa1={kappa1}
        onKappa1={setKappa1}
        kappaPhi={kappaPhi}
        onKappaPhi={setKappaPhi}
        timeWindow={timeWindow}
        onTimeWindow={setTimeWindow}
        playing={playing}
        onPlaying={setPlaying}
        frameIndex={activeIndex}
        onFrameIndex={setFrameIndex}
        frameCount={sim.frameCount}
        loadedFrames={loadedFrames}
        computing={sim.computing}
        showEvolution={showEvolution}
        onShowEvolution={setShowEvolution}
        stats={frame?.stats ?? null}
        truncationWarning={(frame?.stats.tailPopulation ?? 0) > 2e-3}
      />
    </main>
  );
}
