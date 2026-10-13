/**
 * Two-component cat qubit in a truncated Fock basis, real amplitude alpha.
 *
 *   |+_L> = |C_alpha^+> = (|alpha> + |-alpha>) / N_+   (even photon number)
 *   |-_L> = |C_alpha^-> = (|alpha> - |-alpha>) / N_-   (odd photon number)
 *   |0/1_L> = (|+_L> +/- |-_L>) / sqrt(2) = |+/-alpha> + O(e^{-2 alpha^2})
 *
 * With x = (a + a†)/sqrt(2), |alpha> is centred at q = sqrt(2) alpha, p = 0.
 */

import type { LogicalState } from "./state";
import { addScaled, normalizeVector, zeroVector, type CMatrix, type CVector } from "./state";

export const CAT_ALPHA = 2;
export const CAT_ALPHA_MIN = 0.3;
export const CAT_ALPHA_MAX = 3;
export const CAT_CUTOFF = 50;

export function catState(n: number, alpha: number, logical: LogicalState): CVector {
  const even = zeroVector(n);
  const odd = zeroVector(n);
  // Coherent amplitudes e^{-alpha^2/2} alpha^k / sqrt(k!), split by parity.
  let c = Math.exp(-0.5 * alpha * alpha);
  for (let k = 0; k < n; k++) {
    (k % 2 === 0 ? even : odd).re[k] = c;
    c *= alpha / Math.sqrt(k + 1);
  }
  normalizeVector(even);
  normalizeVector(odd);
  if (logical === "+") return even;
  if (logical === "-") return odd;
  const out = zeroVector(n);
  addScaled(out, even, 1, 0);
  addScaled(out, odd, logical === "0" ? 1 : -1, 0);
  return normalizeVector(out);
}

export type CatGate = "X";

/** Logical X: the parity operator e^{i pi a† a}, i.e. (-1)^n on Fock amplitudes. */
export function applyParity(v: CVector): CVector {
  for (let k = 1; k < v.re.length; k += 2) {
    v.re[k] = -(v.re[k] ?? 0);
    v.im[k] = -(v.im[k] ?? 0);
  }
  return v;
}

/** <(-1)^{a† a}> */
export function photonParity(rho: CMatrix): number {
  let s = 0;
  for (let k = 0; k < rho.n; k++) s += (k % 2 === 0 ? 1 : -1) * (rho.re[k * rho.n + k] ?? 0);
  return s;
}

export interface CatRequest {
  id: number;
  cutoff: number;
  alpha: number;
  logical: LogicalState;
  gates: Array<CatGate>;
  kappa1: number;
  kappaPhi: number;
  timeWindow: number;
}

export interface CatStats {
  time: number;
  min: number;
  max: number;
  purity: number;
  meanPhotons: number;
  tailPopulation: number;
  parity: number;
}

export type CatMessage =
  | { type: "meta"; id: number; coords: Float64Array; frameCount: number; size: number }
  | { type: "frame"; id: number; index: number; values: Float64Array; stats: CatStats }
  | { type: "done"; id: number };
