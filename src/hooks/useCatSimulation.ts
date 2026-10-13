import { useEffect, useRef, useState } from "react";

import type { CatMessage, CatStats } from "@/lib/quantum/cat";
import type { LogicalState } from "@/lib/quantum/state";

export interface CatParams {
  cutoff: number;
  alpha: number;
  logical: LogicalState;
}

export interface CatResult {
  coords: Float64Array | null;
  size: number;
  values: Float64Array | null;
  stats: CatStats | null;
  computing: boolean;
}

export function useCatSimulation({ cutoff, alpha, logical }: CatParams): CatResult {
  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const [result, setResult] = useState<CatResult>({
    coords: null,
    size: 0,
    values: null,
    stats: null,
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
      setResult({
        coords: msg.coords,
        size: msg.size,
        values: msg.values,
        stats: msg.stats,
        computing: false,
      });
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
      worker.postMessage({ id: requestId.current, cutoff, alpha, logical });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [cutoff, alpha, logical]);

  return result;
}
