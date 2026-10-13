import { Link } from "@tanstack/react-router";

import { CAT_ALPHA_MAX, CAT_ALPHA_MIN, type CatStats } from "@/lib/quantum/cat";
import { FOCK_CUTOFF_MAX, FOCK_CUTOFF_MIN } from "@/lib/quantum/protocol";
import type { LogicalState } from "@/lib/quantum/state";

import { HoverInfo } from "./HoverInfo";
import { CommitNumber, Row, Section, Slider } from "./PanelUI";
import { Tex } from "./Tex";

const NORM = String.raw`\mathcal N_\pm = \sqrt{2\,(1 \pm e^{-2|\alpha|^2})}`;

const LOGICALS: Array<{ key: LogicalState; label: string; title: string; expr: string }> = [
  {
    key: "0",
    label: "|0_L\\rangle",
    title: "Logical zero — even cat",
    expr: String.raw`\begin{gathered}
    |0_L\rangle = |\mathcal C_\alpha^+\rangle = \tfrac{1}{\mathcal N_+}\big(|\alpha\rangle + |{-\alpha}\rangle\big) \\[2pt]
    ${NORM}
    \end{gathered}`,
  },
  {
    key: "1",
    label: "|1_L\\rangle",
    title: "Logical one — odd cat",
    expr: String.raw`\begin{gathered}
    |1_L\rangle = |\mathcal C_\alpha^-\rangle = \tfrac{1}{\mathcal N_-}\big(|\alpha\rangle - |{-\alpha}\rangle\big) \\[2pt]
    ${NORM}
    \end{gathered}`,
  },
  {
    key: "+",
    label: "|{+}_L\\rangle",
    title: "Logical plus",
    expr: String.raw`\begin{gathered}
    |{+}_L\rangle = \tfrac{1}{\sqrt2}\big(|0_L\rangle + |1_L\rangle\big) \\[2pt]
    \xrightarrow{\;|\alpha|\to\infty\;} |\alpha\rangle
    \end{gathered}`,
  },
  {
    key: "-",
    label: "|{-}_L\\rangle",
    title: "Logical minus",
    expr: String.raw`\begin{gathered}
    |{-}_L\rangle = \tfrac{1}{\sqrt2}\big(|0_L\rangle - |1_L\rangle\big) \\[2pt]
    \xrightarrow{\;|\alpha|\to\infty\;} |{-\alpha}\rangle
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
      <Tex>{String.raw`+1`}</Tex> for the even cat <Tex>{String.raw`|0_L\rangle`}</Tex>,{" "}
      <Tex>{String.raw`-1`}</Tex> for the odd cat <Tex>{String.raw`|1_L\rangle`}</Tex>.
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
  stats: CatStats | null;
  truncationWarning: boolean;
  width?: number;
}

export function CatControlPanel(props: CatControlPanelProps) {
  return (
    <aside
      style={props.width ? { ["--panel-w" as string]: `${props.width}px` } : undefined}
      className="flex w-full shrink-0 flex-col overflow-y-auto border-border bg-card md:h-screen md:w-[var(--panel-w,19rem)] md:border-l"
    >
      <div className="px-3 pt-2 pb-0.5">
        <Link to="/" className="text-[0.6rem] text-muted-foreground hover:text-foreground">
          ← all codes
        </Link>
        <h1 className="text-[0.78rem] font-semibold tracking-tight text-foreground">
          Cat qubit Wigner explorer
        </h1>
        <p className="text-[0.6rem] leading-snug text-muted-foreground">
          Drag the plot to orbit, scroll to zoom.
        </p>
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
