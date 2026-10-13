import { useEffect, useRef, useState } from "react";

import type { CatGate, CatMessage, CatStats } from "@/lib/quantum/cat";
import type { LogicalState } from "@/lib/quantum/state";

export interface CatFrame {
  values: Float64Array;
  stats: CatStats;
}

export interface CatParams {
  cutoff: number;
  alpha: number;
  logical: LogicalState;
  gates: Array<CatGate>;
  kappa1: number;
  kappaPhi: number;
  timeWindow: number;
}

export interface CatResult {
  coords: Float64Array | null;
  size: number;
  frames: CatFrame[];
  frameCount: number;
  computing: boolean;
}

export function useCatSimulation({
  cutoff,
  alpha,
  logical,
  gates,
  kappa1,
  kappaPhi,
  timeWindow,
}: CatParams): CatResult {
  const gateKey = gates.join(",");
  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const [result, setResult] = useState<CatResult>({
    coords: null,
    size: 0,
    frames: [],
    frameCount: 1,
    computing: true,
  });

  useEffect(() => {
    const worker = new Worker(new URL("../workers/cat.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<CatMessage>) => {
      const msg = event.data;
      if (msg.id !== requestId.current) return;
      if (msg.type === "meta") {
        setResult({
          coords: msg.coords,
          size: msg.size,
          frames: [],
          frameCount: msg.frameCount,
          computing: true,
        });
      } else if (msg.type === "frame") {
        setResult((prev) => {
          const frames = prev.frames.slice();
          frames[msg.index] = { values: msg.values, stats: msg.stats };
          return { ...prev, frames };
        });
      } else {
        setResult((prev) => ({ ...prev, computing: false }));
      }
    };
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const worker = workerRef.current;
      if (!worker) return;
      requestId.current += 1;
      setResult((prev) => ({ ...prev, computing: true }));
      worker.postMessage({
        id: requestId.current,
        cutoff,
        alpha,
        logical,
        gates: gateKey ? gateKey.split(",") : [],
        kappa1,
        kappaPhi,
        timeWindow,
      });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [cutoff, alpha, logical, gateKey, kappa1, kappaPhi, timeWindow]);

  return result;
}
