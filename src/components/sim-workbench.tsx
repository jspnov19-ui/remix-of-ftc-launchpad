import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { FieldView3D } from "@/components/field-3d/field-3d";
import {
  COMMAND_HELP,
  DEFAULT_PROGRAM,
  DEMO_LEVEL,
  FIELD_TILES,
  runProgram,
  type Frame,
  type Level,
} from "@/lib/sim";

const TICK_MS = 950;

export function SimWorkbench({
  level = DEMO_LEVEL,
  starter = DEFAULT_PROGRAM,
  onFinish,
  timeLimit,
  variant = "ftc",
}: {
  level?: Level;
  starter?: string;
  onFinish?: (last: Frame) => void;
  timeLimit?: number;
  variant?: "ftc" | "biobuzz";
}) {
  const [source, setSource] = useState(starter);
  useEffect(() => setSource(starter), [starter]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { frames, errors } = useMemo(() => runProgram(source, level), [source]);
  const safeIndex = Math.min(index, frames.length - 1);
  const frame = frames[safeIndex]!;
  const elapsed = frame.t;
  const overTime = timeLimit != null && elapsed > timeLimit;

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [source, level]);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setIndex((i) => {
        if (i >= frames.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, TICK_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, frames.length]);

  useEffect(() => {
    if (safeIndex === frames.length - 1 && safeIndex > 0) onFinish?.(frames[safeIndex]!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex, frames]);
  const codeLines = source.split("\n");

  return (
    <>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="glass-panel overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between border-b border-border bg-white/5 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-tape/70" />
                <span className="size-2.5 rounded-full bg-amber-400/70" />
                <span className="size-2.5 rounded-full bg-accent-teal/80" />
                <span className="ml-2 text-[11px] text-secondary-foreground">autonomous.java</span>
              </div>
              <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
                {frame.crashed ? "✕ crashed" : playing ? "◉ running" : "paused"}
              </span>
            </div>

            <div className="relative aspect-square w-full bg-ink-deep p-2">
              <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading 3D field…</div>}>
                <FieldView3D frame={frame} level={level} variant={variant} />
              </Suspense>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
              {[
                { l: "Mode", v: "Autonomous", c: "" },
                { l: "Score", v: String(frame.score), c: "text-accent-teal" },
                { l: timeLimit ? "Time / limit" : "Time", v: `${elapsed.toFixed(1)}s${timeLimit ? ` / ${timeLimit}s` : ""}`, c: overTime ? "text-tape" : "" },
                {
                  l: "Step",
                  v: `${safeIndex}/${frames.length - 1}`,
                  c: "",
                },
              ].map((m) => (
                <div key={m.l} className="rounded-lg border border-border bg-white/5 px-3 py-2">
                  <p className="text-[10px] tracking-wider text-muted-foreground uppercase">{m.l}</p>
                  <p className={`text-sm font-semibold ${m.c}`}>{m.v}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border p-4">
              <button
                onClick={() => {
                  if (safeIndex >= frames.length - 1) setIndex(0);
                  setPlaying((p) => !p);
                }}
                disabled={errors.length > 0}
                className="rounded-xl bg-accent-teal px-5 py-2.5 font-display font-semibold text-ink shadow-[0_0_24px_-4px_oklch(0.79_0.125_182/0.6)] disabled:opacity-40"
              >
                {playing ? "Pause" : "Run"}
              </button>
              <button
                onClick={() => {
                  setPlaying(false);
                  setIndex((i) => Math.min(i + 1, frames.length - 1));
                }}
                disabled={errors.length > 0}
                className="rounded-xl border border-border bg-white/5 px-4 py-2.5 font-display disabled:opacity-40"
              >
                Step
              </button>
              <button
                onClick={() => {
                  setPlaying(false);
                  setIndex(0);
                }}
                className="rounded-xl border border-border bg-white/5 px-4 py-2.5 font-display"
              >
                Reset
              </button>
              <button
                onClick={() => setSource(starter)}
                className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Restore demo code
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-5">
          <div className="glass-panel overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between border-b border-border bg-white/5 px-4 py-2.5">
              <span className="text-[11px] text-secondary-foreground">Your program</span>
              <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
                line {frame.line || "—"}
              </span>
            </div>
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              spellCheck={false}
              rows={12}
              aria-label="Robot autonomous program"
              className="w-full resize-y bg-ink-deep/60 p-4 font-mono text-[12.5px] leading-relaxed text-secondary-foreground outline-none"
            />
            <div className="border-t border-border p-4">
              {errors.length > 0 ? (
                <ul className="space-y-1 text-xs text-tape">
                  {errors.map((e, i) => (
                    <li key={i}>
                      Line {e.line}: {e.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-1 font-mono text-[12px]">
                  {codeLines.map((l, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 rounded px-2 ${
                        frame.line === i + 1
                          ? "bg-accent-teal/15 text-accent-teal"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span className="w-4 text-right opacity-60">{i + 1}</span>
                      <span className="truncate">{l || " "}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <p className="text-[10px] tracking-wider text-muted-foreground uppercase">
              What just happened
            </p>
            <h2 className="mt-2 font-display text-lg font-semibold text-accent-teal">
              {frame.label}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">{frame.note}</p>
            <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
              {[
                { l: "Position", v: `tile ${frame.x + 1}, ${FIELD_TILES - frame.y}` },
                { l: "Heading", v: `${frame.heading}°` },
                { l: "Arm", v: frame.arm },
                { l: "Claw", v: frame.holding ? "holding sample" : frame.claw },
              ].map((t) => (
                <div key={t.l} className="rounded-lg border border-border bg-white/5 px-3 py-2">
                  <p className="text-[10px] tracking-wider text-muted-foreground uppercase">{t.l}</p>
                  <p className="mt-0.5 font-semibold">{t.v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <p className="text-[10px] tracking-wider text-muted-foreground uppercase">
              Commands you can use
            </p>
            <ul className="mt-3 space-y-2.5">
              {COMMAND_HELP.map((c) => (
                <li key={c.code} className="text-sm">
                  <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-accent-sky">
                    {c.code}
                  </code>
                  <span className="ml-2 text-secondary-foreground">{c.what}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
