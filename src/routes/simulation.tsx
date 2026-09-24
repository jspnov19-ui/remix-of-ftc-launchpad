import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  COMMAND_HELP,
  DEFAULT_PROGRAM,
  FIELD_TILES,
  GOAL_TILE,
  SAMPLE_TILE,
  runProgram,
} from "@/lib/sim";

export const Route = createFileRoute("/simulation")({
  head: () => ({
    meta: [
      { title: "Robot Simulation — 2026-27 Field | Cognition 19655" },
      {
        name: "description",
        content:
          "Write a simplified autonomous program, step through it line by line, and watch a demo FTC robot drive, grab, and score on the 2026-27 field.",
      },
      { property: "og:title", content: "Robot Simulation — 2026-27 FTC Field" },
      {
        property: "og:description",
        content:
          "Edit the demo robot's autonomous code and watch it run on a top-down 2026-27 field with live telemetry.",
      },
    ],
  }),
  component: Simulation,
});

const TICK_MS = 950;

export default function Simulation() {
  const [source, setSource] = useState(DEFAULT_PROGRAM);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { frames, errors } = useMemo(() => runProgram(source), [source]);
  const safeIndex = Math.min(index, frames.length - 1);
  const frame = frames[safeIndex]!;
  const elapsed = Math.min(30, safeIndex * 3.4);

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [source]);

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

  const tile = 100 / FIELD_TILES;
  const codeLines = source.split("\n");

  return (
    <>
      <section className="pt-14 pb-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1 text-[11px] tracking-[0.2em] text-accent-sky uppercase backdrop-blur-md">
          2026–27 field · autonomous period
        </span>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] font-semibold md:text-5xl">
          Program the demo robot
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-secondary-foreground">
          Edit the program, then press Step to run one line at a time. The robot starts at the wall,
          grabs the sample on the yellow tile, and releases it in the teal goal zone.
        </p>
      </section>

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
                {playing ? "◉ running" : "paused"}
              </span>
            </div>

            <div className="relative aspect-square w-full">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 120%,oklch(0.79 0.125 182/0.22),transparent 60%),radial-gradient(circle at 20% 0%,oklch(0.63 0.185 259/0.28),transparent 55%),oklch(0.21 0.034 254)",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px)",
                  backgroundSize: `${tile}% ${tile}%`,
                }}
              />

              {/* goal zone */}
              <div
                className="absolute grid place-items-center rounded-md border-2 border-accent-teal/70 bg-accent-teal/10 text-[9px] tracking-wider text-accent-teal uppercase"
                style={{
                  left: `${GOAL_TILE.x * tile}%`,
                  top: `${GOAL_TILE.y * tile}%`,
                  width: `${tile}%`,
                  height: `${tile}%`,
                }}
              >
                Goal
              </div>

              {/* sample */}
              {!frame.holding && frame.score === 0 && (
                <div
                  className="absolute grid place-items-center"
                  style={{
                    left: `${SAMPLE_TILE.x * tile}%`,
                    top: `${SAMPLE_TILE.y * tile}%`,
                    width: `${tile}%`,
                    height: `${tile}%`,
                  }}
                >
                  <span className="size-4 rounded-sm bg-amber-300 shadow-[0_0_18px_-2px_oklch(0.86_0.16_86)]" />
                </div>
              )}

              {/* starting wall marker */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-accent-sky/40" />

              {/* robot */}
              <div
                className="absolute grid place-items-center transition-all duration-700 ease-out"
                style={{
                  left: `${frame.x * tile}%`,
                  top: `${frame.y * tile}%`,
                  width: `${tile}%`,
                  height: `${tile}%`,
                  transform: `rotate(${frame.heading}deg)`,
                }}
              >
                <div className="relative grid size-[70%] place-items-center rounded-md bg-glass/90 shadow-[0_0_30px_-2px_oklch(0.79_0.125_182/0.8)]">
                  <span className="text-[8px] font-bold text-ink">ROBOT</span>
                  <span
                    className={`absolute -top-1.5 h-2 w-6 rounded-sm transition-colors ${
                      frame.claw === "closed" ? "bg-tape" : "bg-accent-sky"
                    }`}
                  />
                  {frame.holding && (
                    <span
                      className={`absolute size-3 rounded-sm bg-amber-300 transition-all ${
                        frame.arm === "up" ? "-top-4" : "-top-2"
                      }`}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
              {[
                { l: "Mode", v: "Autonomous", c: "" },
                { l: "Score", v: String(frame.score), c: "text-accent-teal" },
                { l: "Time", v: `${elapsed.toFixed(1)}s`, c: "" },
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
                onClick={() => setSource(DEFAULT_PROGRAM)}
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
