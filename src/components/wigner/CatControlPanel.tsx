import { Link } from "@tanstack/react-router";
import { LineChart, Pause, Play, RotateCcw, Undo2 } from "lucide-react";

import { CAT_ALPHA_MAX, CAT_ALPHA_MIN, type CatGate, type CatStats } from "@/lib/quantum/cat";
import { FOCK_CUTOFF_MAX, FOCK_CUTOFF_MIN, TIME_WINDOW_MAX } from "@/lib/quantum/protocol";
import type { LogicalState } from "@/lib/quantum/state";

import { HoverInfo } from "./HoverInfo";
import { CommitNumber, Row, Section, Slider } from "./PanelUI";
import { Tex } from "./Tex";

const NORM = String.raw`\mathcal N_\pm = \sqrt{2\,(1 \pm e^{-2|\alpha|^2})}`;

const LOGICALS: Array<{ key: LogicalState; label: string; title: string; expr: string }> = [
  {
    key: "0",
    label: "|0_L\\rangle",
    title: "Logical zero",
    expr: String.raw`\begin{gathered}
    |0_L\rangle = \tfrac{1}{\sqrt2}\big(|{+}_L\rangle + |{-}_L\rangle\big) \\[2pt]
    = |\alpha\rangle + \mathcal O\big(e^{-2|\alpha|^2}\big)
    \end{gathered}`,
  },
  {
    key: "1",
    label: "|1_L\\rangle",
    title: "Logical one",
    expr: String.raw`\begin{gathered}
    |1_L\rangle = \tfrac{1}{\sqrt2}\big(|{+}_L\rangle - |{-}_L\rangle\big) \\[2pt]
    = |{-\alpha}\rangle + \mathcal O\big(e^{-2|\alpha|^2}\big)
    \end{gathered}`,
  },
  {
    key: "+",
    label: "|{+}_L\\rangle",
    title: "Logical plus — even cat",
    expr: String.raw`\begin{gathered}
    |{+}_L\rangle = |\mathcal C_\alpha^+\rangle = \tfrac{1}{\mathcal N_+}\big(|\alpha\rangle + |{-\alpha}\rangle\big) \\[2pt]
    ${NORM}
    \end{gathered}`,
  },
  {
    key: "-",
    label: "|{-}_L\\rangle",
    title: "Logical minus — odd cat",
    expr: String.raw`\begin{gathered}
    |{-}_L\rangle = |\mathcal C_\alpha^-\rangle = \tfrac{1}{\mathcal N_-}\big(|\alpha\rangle - |{-\alpha}\rangle\big) \\[2pt]
    ${NORM}
    \end{gathered}`,
  },
];

const ALPHA_INFO = (
  <>
    <p className="mb-1 font-semibold">Cat size</p>
    <Tex block>{String.raw`|\alpha\rangle = e^{-|\alpha|^2/2}\sum_n \frac{\alpha^n}{\sqrt{n!}}\,|n\rangle`}</Tex>
    <p>
      The two coherent-state blobs sit at <Tex>{String.raw`q = \pm\sqrt2\,\alpha`}</Tex>. Larger{" "}
      <Tex>{String.raw`\alpha`}</Tex> separates them further (fringes between them get finer) at the
      cost of more photons, <Tex>{String.raw`\langle \hat a^\dagger \hat a\rangle \approx |\alpha|^2`}</Tex>.
    </p>
  </>
);

const PARITY_INFO = (
  <>
    <p className="mb-1 font-semibold">Photon-number parity</p>
    <Tex block>{String.raw`\hat \Pi = e^{i\pi \hat a^\dagger \hat a},\qquad \langle\hat\Pi\rangle = \pi\, W(0,0)`}</Tex>
    <p>
      Parity is the logical <Tex>{String.raw`\hat X_L`}</Tex>: <Tex>{String.raw`+1`}</Tex> for the
      even cat <Tex>{String.raw`|{+}_L\rangle`}</Tex>, <Tex>{String.raw`-1`}</Tex> for the odd cat{" "}
      <Tex>{String.raw`|{-}_L\rangle`}</Tex>, and exactly 0 for{" "}
      <Tex>{String.raw`|0_L\rangle, |1_L\rangle`}</Tex>. A photon loss flips it (a phase flip).
    </p>
  </>
);

const X_INFO = (
  <>
    <p className="mb-1 font-semibold">Logical bit flip (exact)</p>
    <Tex block>{String.raw`\hat X_L = \hat \Pi = e^{i\pi \hat a^\dagger \hat a}`}</Tex>
    <p>
      A <Tex>{String.raw`180^\circ`}</Tex> rotation of phase space,{" "}
      <Tex>{String.raw`e^{i\pi \hat a^\dagger \hat a}|\alpha\rangle = |{-\alpha}\rangle`}</Tex>: it
      swaps <Tex>{String.raw`|0_L\rangle \leftrightarrow |1_L\rangle`}</Tex> exactly and leaves the
      cats <Tex>{String.raw`|{\pm}_L\rangle`}</Tex> unchanged up to a sign.
    </p>
  </>
);

const TAIL_INFO = (
  <>
    <p className="mb-1 font-semibold">Truncation error</p>
    <Tex block>{String.raw`\sum_{n > N-5} \rho_{nn}`}</Tex>
    <p>
      Population in the top five Fock levels. If it grows, raise the cutoff{" "}
      <Tex>{String.raw`N`}</Tex>.
    </p>
  </>
);

interface CatControlPanelProps {
  alpha: number;
  onAlpha: (v: number) => void;
  cutoff: number;
  onCutoff: (v: number) => void;
  logical: LogicalState;
  onLogical: (v: LogicalState) => void;
  gates: Array<CatGate>;
  onGate: (g: CatGate) => void;
  onReset: () => void;
  kappa1: number;
  onKappa1: (v: number) => void;
  kappaPhi: number;
  onKappaPhi: (v: number) => void;
  timeWindow: number;
  onTimeWindow: (v: number) => void;
  playing: boolean;
  onPlaying: (v: boolean) => void;
  frameIndex: number;
  onFrameIndex: (v: number) => void;
  frameCount: number;
  loadedFrames: number;
  computing: boolean;
  showEvolution: boolean;
  onShowEvolution: (v: boolean) => void;
  stats: CatStats | null;
  truncationWarning: boolean;
  width?: number;
}

export function CatControlPanel(props: CatControlPanelProps) {
  const dynamic = props.kappa1 > 0 || props.kappaPhi > 0;
  const time = props.stats?.time ?? 0;

  return (
    <aside
      style={props.width ? { ["--panel-w" as string]: `${props.width}px` } : undefined}
      className="flex w-full shrink-0 flex-col overflow-y-auto border-border bg-card md:h-screen md:w-[var(--panel-w,19rem)] md:border-l"
    >
      <div className="px-3 pt-2 pb-0.5">
        <Link
          to="/"
          title="Back to all codes"
          aria-label="Back to all codes"
          className="mb-1 inline-flex rounded border border-border bg-background p-1 text-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <Undo2 className="size-4" strokeWidth={2} />
        </Link>
        <h1 className="text-[0.78rem] font-semibold tracking-tight text-foreground">
          Cat qubit Wigner explorer
        </h1>
      </div>

      <Section title="Code word">
        <div className="grid grid-cols-4 gap-1">
          {LOGICALS.map((l) => (
            <HoverInfo
              key={l.key}
              align="left"
              className="w-full"
              info={
                <>
                  <p className="mb-1 font-semibold">{l.title}</p>
                  <Tex block>{l.expr}</Tex>
                </>
              }
            >
              <button
                onClick={() => props.onLogical(l.key)}
                className={`w-full rounded border px-0.5 py-0.5 text-[0.62rem] leading-tight transition-colors ${
                  props.logical === l.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-accent"
                }`}
              >
                <Tex>{l.label}</Tex>
              </button>
            </HoverInfo>
          ))}
        </div>
      </Section>

      <Section title="Cat size">
        <Slider
          label={
            <HoverInfo align="left" info={ALPHA_INFO}>
              <Tex className="cursor-help underline decoration-dotted underline-offset-2">
                {String.raw`\alpha`}
              </Tex>
            </HoverInfo>
          }
          readout={`${props.alpha.toFixed(2)} · |α|² = ${(props.alpha * props.alpha).toFixed(2)}`}
          min={CAT_ALPHA_MIN}
          max={CAT_ALPHA_MAX}
          step={0.01}
          value={props.alpha}
          onChange={props.onAlpha}
        />
        <label className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[0.6rem] text-foreground">
            <Tex>{String.raw`N`}</Tex> — Fock cutoff
          </span>
          <span className="flex items-center gap-1">
            <CommitNumber
              value={props.cutoff}
              min={FOCK_CUTOFF_MIN}
              max={FOCK_CUTOFF_MAX}
              step={1}
              round
              onCommit={props.onCutoff}
            />
            <span className="text-[0.56rem] text-muted-foreground">
              {FOCK_CUTOFF_MIN}–{FOCK_CUTOFF_MAX} ⏎
            </span>
          </span>
        </label>
        {props.truncationWarning && (
          <p className="mt-1 text-[0.58rem] leading-snug text-destructive">
            Fock truncation stressed here — raise <Tex>{String.raw`N`}</Tex>.
          </p>
        )}
      </Section>

      <Section title="Operations">
        <div className="flex flex-wrap items-center gap-1">
          <HoverInfo align="left" info={X_INFO}>
            <button
              onClick={() => props.onGate("X")}
              className="cursor-help rounded border border-border bg-background px-1.5 py-0.5 text-[0.62rem] text-foreground transition-colors hover:bg-accent"
            >
              <Tex>{String.raw`\hat X_L`}</Tex> — bit flip
            </button>
          </HoverInfo>
          <button
            onClick={props.onReset}
            className="flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[0.62rem] text-muted-foreground transition-colors hover:bg-accent"
          >
            <RotateCcw className="size-2.5" /> reset
          </button>
          <span className="ml-auto font-mono text-[0.6rem] text-muted-foreground">
            {props.gates.length ? props.gates.join("·") : "—"}
          </span>
        </div>
      </Section>

      <Section title="Jump operators">
        <Slider
          label={<Tex>{String.raw`\kappa_1 \;\text{— loss},\; \hat L = \sqrt{\kappa_1}\,\hat a`}</Tex>}
          readout={props.kappa1.toFixed(2)}
          min={0}
          max={0.5}
          step={0.01}
          value={props.kappa1}
          onChange={props.onKappa1}
        />
        <div className="mt-1">
          <Slider
            label={
              <Tex>
                {String.raw`\kappa_\phi \;\text{— dephasing},\; \hat L = \sqrt{\kappa_\phi}\,\hat a^\dagger \hat a`}
              </Tex>
            }
            readout={props.kappaPhi.toFixed(2)}
            min={0}
            max={0.5}
            step={0.01}
            value={props.kappaPhi}
            onChange={props.onKappaPhi}
          />
        </div>
      </Section>

      <Section title="Time evolution">
        <label className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[0.66rem] text-foreground">
            <Tex>{String.raw`t_{\max}`}</Tex>
          </span>
          <span className="flex items-center gap-1">
            <CommitNumber
              value={props.timeWindow}
              min={0.1}
              max={TIME_WINDOW_MAX}
              step={0.1}
              onCommit={props.onTimeWindow}
            />
            <span className="text-[0.56rem] text-muted-foreground">max {TIME_WINDOW_MAX} ⏎</span>
          </span>
        </label>
        <div className="flex items-center gap-2">
          <button
            disabled={!dynamic}
            onClick={() => props.onPlaying(!props.playing)}
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            aria-label={props.playing ? "Pause" : "Play"}
          >
            {props.playing ? <Pause className="size-3" /> : <Play className="size-3" />}
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(0, props.frameCount - 1)}
            step={1}
            value={props.frameIndex}
            disabled={!dynamic}
            onChange={(e) => {
              props.onPlaying(false);
              props.onFrameIndex(Number(e.target.value));
            }}
            className="h-1 w-full accent-primary disabled:opacity-40"
          />
          <span className="w-14 shrink-0 text-[0.62rem] text-muted-foreground">
            <Tex>{String.raw`t = ${time.toFixed(2)}`}</Tex>
          </span>
        </div>
        <button
          onClick={() => props.onShowEvolution(!props.showEvolution)}
          className={`mt-1 flex w-full items-center justify-center gap-1 rounded border px-1.5 py-0.5 text-[0.62rem] transition-colors ${
            props.showEvolution
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-accent"
          }`}
        >
          <LineChart className="size-2.5" />
          {props.showEvolution ? "hide" : "show"} parity and photons vs time
        </button>
        {dynamic && props.computing && (
          <p className="mt-1 font-mono text-[0.6rem] text-muted-foreground">
            solving Lindblad… {props.loadedFrames}/{props.frameCount}
          </p>
        )}
      </Section>

      <Section title="Diagnostics">
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          <Row
            label={String.raw`\langle \hat \Pi\rangle`}
            value={(props.stats?.parity ?? 0).toFixed(4)}
            info={PARITY_INFO}
          />
          <Row
            label={String.raw`\mathrm{Tr}\,\hat\rho^2`}
            value={(props.stats?.purity ?? 0).toFixed(4)}
          />
          <Row
            label={String.raw`\langle \hat a^\dagger \hat a\rangle`}
            value={(props.stats?.meanPhotons ?? 0).toFixed(3)}
          />
          <Row
            label={String.raw`\sum_{n>N-5} \rho_{nn}`}
            value={(props.stats?.tailPopulation ?? 0).toExponential(1)}
            info={TAIL_INFO}
          />
        </div>
      </Section>
    </aside>
  );
}
