/// <reference lib="webworker" />

import {
  CAT_ALPHA_MAX,
  CAT_ALPHA_MIN,
  CAT_CUTOFF,
  catState,
  photonParity,
  type CatMessage,
  type CatRequest,
} from "@/lib/quantum/cat";
import { FOCK_CUTOFF_MAX, FOCK_CUTOFF_MIN, GRID_SIZE, PHASE_LIMIT } from "@/lib/quantum/protocol";
import { densityFromVector, diagnostics } from "@/lib/quantum/state";
import { hermiteBasis, makeAxes, wignerGrid } from "@/lib/quantum/wigner";

const axes = makeAxes(PHASE_LIMIT, GRID_SIZE, 0.05);

let cached: { n: number; basis: Float64Array } | null = null;
const basisFor = (n: number): Float64Array => {
  if (!cached || cached.n !== n) cached = { n, basis: hermiteBasis(axes.fine, n) };
  return cached.basis;
};

self.onmessage = (event: MessageEvent<CatRequest>) => {
  const req = event.data;
  const cutoff = Math.round(
    Math.min(FOCK_CUTOFF_MAX, Math.max(FOCK_CUTOFF_MIN, req.cutoff || CAT_CUTOFF)),
  );
  const alpha = Math.min(CAT_ALPHA_MAX, Math.max(CAT_ALPHA_MIN, req.alpha));

  const rho = densityFromVector(catState(cutoff, alpha, req.logical));
  const grid = wignerGrid(rho, axes, basisFor(cutoff));
  const diag = diagnostics(rho);

  const msg: CatMessage = {
    id: req.id,
    coords: new Float64Array(axes.coords),
    size: GRID_SIZE,
    values: grid.values,
    stats: {
      min: grid.min,
      max: grid.max,
      purity: diag.purity,
      meanPhotons: diag.meanPhotons,
      tailPopulation: diag.tailPopulation,
      parity: photonParity(rho),
    },
  };
  (self as unknown as Worker).postMessage(msg, [grid.values.buffer, msg.coords.buffer]);
};
