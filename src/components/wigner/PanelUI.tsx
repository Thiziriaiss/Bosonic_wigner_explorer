import { useEffect, useState } from "react";

import { HoverInfo } from "./HoverInfo";
import { Tex } from "./Tex";

export function Row({
  label,
  value,
  info,
}: {
  label: string;
  value: string;
  info?: React.ReactNode;
}) {
  const labelNode = (
    <Tex
      className={`text-[0.66rem] text-foreground ${
        info ? "cursor-help underline decoration-dotted underline-offset-2" : ""
      }`}
    >
      {label}
    </Tex>
  );
  return (
    <div className="flex items-baseline justify-between gap-2">
      {info ? (
        <HoverInfo align="left" info={info}>
          {labelNode}
        </HoverInfo>
      ) : (
        labelNode
      )}
      <span className="font-mono text-[0.6rem] text-foreground">{value}</span>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border px-3 py-1.5 first:border-t-0">
      <h2 className="mb-1 text-[0.56rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Slider(props: {
  label: React.ReactNode;
  readout: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[0.6rem] leading-tight text-foreground">{props.label}</span>
        <span className="font-mono text-[0.6rem] text-muted-foreground">{props.readout}</span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="mt-0.5 h-1 w-full accent-primary"
      />
    </label>
  );
}

export function CommitNumber(props: {
  value: number;
  min: number;
  max: number;
  step: number;
  round?: boolean;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(props.value));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(String(props.value));
    setDirty(false);
  }, [props.value]);

  const commit = () => {
    const v = Number(draft);
    if (!Number.isFinite(v)) {
      setDraft(String(props.value));
      setDirty(false);
      return;
    }
    let next = Math.min(props.max, Math.max(props.min, v));
    if (props.round) next = Math.round(next);
    setDraft(String(next));
    setDirty(false);
    if (next !== props.value) props.onCommit(next);
  };

  return (
    <input
      type="number"
      min={props.min}
      max={props.max}
      step={props.step}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        setDirty(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
      }}
      onBlur={commit}
      className={`w-14 rounded border bg-background px-1 py-0.5 text-right font-mono text-[0.6rem] text-foreground ${
        dirty ? "border-primary" : "border-border"
      }`}
    />
  );
}
