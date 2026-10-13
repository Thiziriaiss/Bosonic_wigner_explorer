/// <reference lib="webworker" />

import {
  CAT_ALPHA_MAX,
  CAT_ALPHA_MIN,
  CAT_CUTOFF,
  applyParity,
  catState,
  photonParity,
  type CatMessage,
  type CatRequest,
} from "@/lib/quantum/cat";
import { evolve } from "@/lib/quantum/lindblad";
import {
  FOCK_CUTOFF_MAX,
  FOCK_CUTOFF_MIN,
  FRAME_COUNT,
  GRID_SIZE,
  PHASE_LIMIT,
  TIME_WINDOW,
} from "@/lib/quantum/protocol";
import { densityFromVector, diagnostics } from "@/lib/quantum/state";
import { hermiteBasis, makeAxes, wignerGrid } from "@/lib/quantum/wigner";

const axes = makeAxes(PHASE_LIMIT, GRID_SIZE, 0.05);

let cached: { n: number; basis: Float64Array } | null = null;
const basisFor = (n: number): Float64Array => {
  if (!cached || cached.n !== n) cached = { n, basis: hermiteBasis(axes.fine, n) };
  return cached.basis;
};

let currentId = 0;

const post = (msg: CatMessage, transfer: Transferable[] = []) =>
  (self as unknown as Worker).postMessage(msg, transfer);

self.onmessage = (event: MessageEvent<CatRequest>) => {
  const req = event.data;
  currentId = req.id;

  const cutoff = Math.round(
    Math.min(FOCK_CUTOFF_MAX, Math.max(FOCK_CUTOFF_MIN, req.cutoff || CAT_CUTOFF)),
  );
  const alpha = Math.min(CAT_ALPHA_MAX, Math.max(CAT_ALPHA_MIN, req.alpha));
  const basis = basisFor(cutoff);

  const dissipative = req.kappa1 > 0 || req.kappaPhi > 0;
  const frameCount = dissipative ? FRAME_COUNT : 1;
  const window = Math.min(10, Math.max(0.1, req.timeWindow || TIME_WINDOW));
  const dtFrame = window / (FRAME_COUNT - 1);
  const stepsPerFrame = Math.max(1, Math.ceil(dtFrame / 0.005));
  const dt = dtFrame / stepsPerFrame;

  post({
    type: "meta",
    id: req.id,
    coords: new Float64Array(axes.coords),
    frameCount,
    size: GRID_SIZE,
  });

  const psi = catState(cutoff, alpha, req.logical);
  for (const gate of req.gates) {
    if (gate === "X") applyParity(psi);
  }
  const rho = densityFromVector(psi);

  for (let f = 0; f < frameCount; f++) {
    if (currentId !== req.id) return;
    if (f > 0) evolve(rho, req.kappa1, req.kappaPhi, dt, stepsPerFrame);
    const grid = wignerGrid(rho, axes, basis);
    const diag = diagnostics(rho);
    post(
      {
        type: "frame",
        id: req.id,
        index: f,
        values: grid.values,
        stats: {
          time: f * dtFrame,
          min: grid.min,
          max: grid.max,
          purity: diag.purity,
          meanPhotons: diag.meanPhotons,
          tailPopulation: diag.tailPopulation,
          parity: photonParity(rho),
        },
      },
      [grid.values.buffer],
    );
  }

  post({ type: "done", id: req.id });
};
