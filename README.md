# Bosonic Wigner explorer

Interactive 3D Wigner functions of bosonic quantum error-correcting codes. Pick a code, choose a logical state, apply logical operations, and watch photon loss and dephasing act on the state under the Lindblad master equation.

**Live version:** https://bosonic-wigner-explorer.thiziriaissaoui.workers.dev/

## Codes

### GKP qubit (`/gkp`)

A finite-energy (physical) GKP qubit.

- Logical states |0_L⟩, |1_L⟩, |+_L⟩, |−_L⟩
- Square or rectangular code lattice
- Squeezing parameter Δ and Fock cutoff N
- Logical X and Z gates and the two stabilizers, applied as envelope-dressed phase-space displacements
- Diagnostics: finite-energy stabilizer expectation values, purity, mean photon number, truncation error
- Stabilizers-vs-time plot

### Two-legged cat qubit (`/cat`)

Built from the coherent states |±α⟩, using the convention of Guillaud & Mirrahimi:

- |+_L⟩ = |C_α^+⟩ ∝ |α⟩ + |−α⟩ (even cat), |−_L⟩ = |C_α^−⟩ ∝ |α⟩ − |−α⟩ (odd cat)
- |0_L⟩, |1_L⟩ = (|+_L⟩ ± |−_L⟩)/√2 = |±α⟩ up to corrections of order e^{−2|α|²}
- Cat amplitude α and Fock cutoff N
- Exact logical bit flip X_L = Π = e^{iπ a†a} (photon-number parity)
- Diagnostics: parity, purity, mean photon number, truncation error
- Parity-and-photon-number-vs-time plot

### Shared by both codes

- 3D Wigner surface you can orbit and zoom, with preset camera views
- Photon loss (L = √κ₁ a) and dephasing (L = √κ_φ a†a), solved with the Lindblad master equation and animated over time
- Hover any label or button to see the formula behind it

All states are computed in a truncated Fock basis, in Web Workers, directly in the browser.

## Running locally

You need [Bun](https://bun.sh) (Node.js with npm also works). Then:

```sh
git clone https://github.com/Thiziriaiss/Bosonic_wigner_explorer.git
cd Bosonic_wigner_explorer
bun install
bun run dev
```

Open the local URL printed in the terminal. Code changes show up in the browser immediately.

## Adding a new code

Each code has its own page, and they share the 3D renderer and the Lindblad solver:

| Piece | GKP | Cat |
| --- | --- | --- |
| Page (route) | `src/routes/gkp.tsx` | `src/routes/cat.tsx` |
| States and operators | `src/lib/quantum/state.ts` | `src/lib/quantum/cat.ts` |
| Simulation worker | `src/workers/gkp.worker.ts` | `src/workers/cat.worker.ts` |
| React hook | `src/hooks/useGkpSimulation.ts` | `src/hooks/useCatSimulation.ts` |
| Control panel | `src/components/wigner/ControlPanel.tsx` | `src/components/wigner/CatControlPanel.tsx` |

Shared pieces:

- Wigner function: `src/lib/quantum/wigner.ts`
- Lindblad solver: `src/lib/quantum/lindblad.ts`
- 3D scene: `src/components/wigner/WignerScene.tsx`
- Panel widgets: `src/components/wigner/PanelUI.tsx`

To add a code, add a new set of these files and a link on the home page (`src/routes/index.tsx`).

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- React Three Fiber / three.js
- KaTeX

---

by Thiziri Aissaoui (with AI)
