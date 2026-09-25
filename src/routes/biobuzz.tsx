import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { BioBuzzField3D } from "@/components/biobuzz-3d";
import {
  BIOBUZZ_COMMANDS,
  BIOBUZZ_TILES,
  applyAction,
  createBioBuzzState,
  runBioBuzzProgram,
  type BioBuzzAction,
  type BioBuzzState,
} from "@/lib/biobuzz-sim";

export const Route = createFileRoute("/biobuzz")({
  head: () => ({
    meta: [
      { title: "BioBuzz Corner — Pollen Collection Field | Cognition 19655" },
      {
        name: "description",
        content:
          "A biological-themed FTC field with flowers, pollen, and nectar bins. Drive the robot with keyboard teleop or write autonomous scripts.",
      },
      { property: "og:title", content: "BioBuzz Corner — Pollen Collection Field" },
      {
        property: "og:description",
        content: "Explore a biological FTC field: collect pollen from flowers and deposit it in nectar bins.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BioBuzz,
});

type Mode = "teleop" | "auto";

const DEFAULT_BIOBUZZ_PROGRAM = `// BioBuzz autonomous — collect pollen and deposit
// Flowers are scattered across the 12x12 field.
// Nectar bins are at center (6,6) and top-right (11,0).

drive(2)       // move forward
turn(90)       // face right
drive(2)       // reach first flower
claw(close)    // grab pollen
arm(up)        // lift it
turn(-90)      // face forward again
drive(4)       // head to center bin
deposit()      // drop pollen in the bin
`;

function TeleopPanel({ state, onAction }: { state: BioBuzzState; onAction: (a: BioBuzzAction) => void }) {
  const keys: { key: string; label: string; action: BioBuzzAction }[] = [
    { key: "W", label: "Forward", action: "forward" },
    { key: "S", label: "Back", action: "back" },
    { key: "A", label: "Strafe L", action: "left" },
    { key: "D", label: "Strafe R", action: "right" },
    { key: "←", label: "Turn L", action: "turnLeft" },
    { key: "→", label: "Turn R", action: "turnRight" },
    { key: "I", label: "Arm Up", action: "armUp" },
    { key: "K", label: "Arm Dn", action: "armDown" },
    { key: "O", label: "Claw Open", action: "clawOpen" },
    { key: "P", label: "Claw Close", action: "clawClose" },
    { key: "⏎", label: "Deposit", action: "deposit" },
  ];

  return (
    <div className="glass-panel rounded-3xl p-6">
      <p className="text-[10px] tracking-wider text-muted-foreground uppercase">Keyboard controls</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {keys.map((k) => (
          <button
            key={k.key}
            onClick={() => onAction(k.action)}
            className="flex items-center gap-2 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm transition-colors hover:bg-white/10"
          >
            <kbd className="rounded bg-ink-deep px-2 py-0.5 font-mono text-xs text-accent-teal">{k.key}</kbd>
            <span className="text-secondary-foreground">{k.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-border bg-white/5 p-3">
        <p className="text-xs text-secondary-foreground">{state.message}</p>
      </div>
    </div>
  );
}

function AutoPanel({
  source,
  setSource,
  state,
  onReset,
}: {
  source: string;
  setSource: (s: string) => void;
  state: BioBuzzState;
  onReset: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { states, errors } = useMemo(() => runBioBuzzProgram(source), [source]);
  const safeIndex = Math.min(index, states.length - 1);
  const currentState = states[safeIndex] ?? createBioBuzzState();

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [source]);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setIndex((i) => {
        if (i >= states.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 800);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, states.length]);

  const codeLines = source.split("\n");

  return (
    <div className="glass-panel overflow-hidden rounded-3xl">
      <div className="flex items-center justify-between border-b border-border bg-white/5 px-4 py-2.5">
        <span className="text-[11px] text-secondary-foreground">biobuzz_auto.java</span>
        <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
          {playing ? "◉ running" : "paused"}
        </span>
      </div>
      <textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
        spellCheck={false}
        rows={10}
        aria-label="BioBuzz autonomous program"
        className="w-full resize-y bg-ink-deep/60 p-4 font-mono text-[12.5px] leading-relaxed text-secondary-foreground outline-none"
      />
      <div className="border-t border-border p-4">
        {errors.length > 0 ? (
          <ul className="space-y-1 text-xs text-tape">
            {errors.map((e, i) => (
              <li key={i}>Line {e.line}: {e.message}</li>
            ))}
          </ul>
        ) : (
          <div className="space-y-1 font-mono text-[12px]">
            {codeLines.map((l, i) => (
              <div key={i} className="flex gap-3 rounded px-2 text-muted-foreground">
                <span className="w-4 text-right opacity-60">{i + 1}</span>
                <span className="truncate">{l || " "}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-border p-4">
        <button
          onClick={() => {
            if (safeIndex >= states.length - 1) setIndex(0);
            setPlaying((p) => !p);
          }}
          disabled={errors.length > 0}
          className="rounded-xl bg-accent-teal px-5 py-2.5 font-display font-semibold text-ink disabled:opacity-40"
        >
          {playing ? "Pause" : "Run"}
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setIndex((i) => Math.min(i + 1, states.length - 1));
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
            onReset();
          }}
          className="rounded-xl border border-border bg-white/5 px-4 py-2.5 font-display"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function BioBuzz() {
  const [mode, setMode] = useState<Mode>("teleop");
  const [state, setState] = useState<BioBuzzState>(createBioBuzzState);
  const [autoSource, setAutoSource] = useState(DEFAULT_BIOBUZZ_PROGRAM);

  // Keyboard handler for teleop
  useEffect(() => {
    if (mode !== "teleop") return;
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const map: Record<string, BioBuzzAction> = {
        w: "forward",
        s: "back",
        a: "left",
        d: "right",
        arrowleft: "turnLeft",
        arrowright: "turnRight",
        i: "armUp",
        k: "armDown",
        o: "clawOpen",
        p: "clawClose",
        enter: "deposit",
      };
      const action = map[key];
      if (action) {
        e.preventDefault();
        setState((s) => applyAction(s, action));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode]);

  const handleReset = () => setState(createBioBuzzState());

  return (
    <>
      <section className="pt-14 pb-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1 text-[11px] tracking-[0.2em] text-accent-sky uppercase backdrop-blur-md">
          BioBuzz Corner
        </span>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] font-semibold md:text-5xl">
          Pollen <span className="text-accent-teal">collection field</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-secondary-foreground">
          A biological-themed 12×12 field with flowers, pollen nodes, and nectar collection bins.
          Drive the robot with your keyboard or write an autonomous script to clear the field.
        </p>
      </section>

      {/* Mode toggle */}
      <div className="mb-5 flex rounded-xl border border-border bg-white/5 p-1 w-fit">
        <button
          onClick={() => { setMode("teleop"); handleReset(); }}
          className={`rounded-lg px-5 py-2 font-display text-sm transition-colors ${
            mode === "teleop" ? "bg-accent-teal/20 text-accent-teal" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Teleop Mode
        </button>
        <button
          onClick={() => { setMode("auto"); handleReset(); }}
          className={`rounded-lg px-5 py-2 font-display text-sm transition-colors ${
            mode === "auto" ? "bg-accent-teal/20 text-accent-teal" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Autonomous Mode
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="glass-panel overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between border-b border-border bg-white/5 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-pink-400/70" />
                <span className="size-2.5 rounded-full bg-yellow-400/70" />
                <span className="size-2.5 rounded-full bg-purple-400/80" />
                <span className="ml-2 text-[11px] text-secondary-foreground">biobuzz_field.sim</span>
              </div>
              <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
                {mode === "teleop" ? "◉ teleop" : "◉ autonomous"}
              </span>
            </div>

            <div className="relative aspect-square w-full bg-ink-deep p-2">
              <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading BioBuzz field…</div>}>
                <BioBuzzField3D state={mode === "teleop" ? state : state} />
              </Suspense>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
              {[
                { l: "Score", v: String(state.robot.score), c: "text-accent-teal" },
                { l: "Pollen", v: String(state.robot.pollenCount), c: "" },
                { l: "Time", v: `${state.time.toFixed(1)}s`, c: "" },
                { l: "Position", v: `${state.robot.x + 1}, ${BIOBUZZ_TILES - state.robot.y}`, c: "" },
              ].map((m) => (
                <div key={m.l} className="rounded-lg border border-border bg-white/5 px-3 py-2">
                  <p className="text-[10px] tracking-wider text-muted-foreground uppercase">{m.l}</p>
                  <p className={`text-sm font-semibold ${m.c}`}>{m.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-5">
          {mode === "teleop" ? (
            <TeleopPanel state={state} onAction={(a) => setState((s) => applyAction(s, a))} />
          ) : (
            <AutoPanel source={autoSource} setSource={setAutoSource} state={state} onReset={handleReset} />
          )}

          <div className="glass-panel rounded-3xl p-6">
            <p className="text-[10px] tracking-wider text-muted-foreground uppercase">Status</p>
            <h2 className="mt-2 font-display text-lg font-semibold text-accent-teal">
              {mode === "teleop" ? state.message : "Autonomous running"}
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
              {[
                { l: "Heading", v: `${state.robot.heading}°` },
                { l: "Arm", v: state.robot.arm },
                { l: "Claw", v: state.robot.holding ? "holding pollen" : state.robot.claw },
                { l: "Pollen left", v: String(state.pollen.filter((p) => !p.collected).length) },
              ].map((t) => (
                <div key={t.l} className="rounded-lg border border-border bg-white/5 px-3 py-2">
                  <p className="text-[10px] tracking-wider text-muted-foreground uppercase">{t.l}</p>
                  <p className="mt-0.5 font-semibold">{t.v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <p className="text-[10px] tracking-wider text-muted-foreground uppercase">Commands</p>
            <ul className="mt-3 space-y-2.5">
              {BIOBUZZ_COMMANDS.map((c) => (
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
