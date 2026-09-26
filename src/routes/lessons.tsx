import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LockKeyhole, Route as RouteIcon } from "lucide-react";
import { SimWorkbench } from "@/components/sim-workbench";
import { LESSONS } from "@/lib/lessons";

export const Route = createFileRoute("/lessons")({
  head: () => ({
    meta: [
      { title: "FTC Coding Lessons | Cognition 19655" },
      { name: "description", content: "Five step-by-step lessons teaching FTC autonomous programming: driving, turning, grabbing and scoring." },
      { property: "og:title", content: "FTC Coding Lessons — Cognition 19655" },
      { property: "og:description", content: "Learn FTC autonomous programming one lesson at a time in a realistic field simulator." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Lessons,
});

function Lessons() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const [mode, setMode] = useState<"manual" | "guided">("manual");
  const [checkpoint, setCheckpoint] = useState("");
  const lesson = LESSONS[i]!;
  const requiredCommand = lesson.id === "drive" ? "drive(3)" : lesson.id === "turn" ? "drive(2)" : lesson.id === "grab" ? "drive(2)" : lesson.id === "score" ? "drive(2)" : "turn(90)";
  const checkpointPassed = mode === "manual" || checkpoint.trim() === requiredCommand;

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem("c19-lessons") || "{}"));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    setShowHint(false);
    setCheckpoint("");
  }, [i, mode]);

  const finish = (ok: boolean) => {
    if (!ok || done[lesson.id]) return;
    const next = { ...done, [lesson.id]: true };
    setDone(next);
    localStorage.setItem("c19-lessons", JSON.stringify(next));
  };

  const completed = LESSONS.filter((l) => done[l.id]).length;

  return (
    <>
      <section className="pt-14 pb-8">
        <span className="inline-flex rounded-full border border-border bg-white/5 px-3 py-1 text-[11px] tracking-[0.2em] text-accent-sky uppercase">
          {completed}/{LESSONS.length} complete
        </span>
        <h1 className="mt-5 font-display text-4xl font-semibold md:text-5xl">Learn to code an FTC robot</h1>
        <p className="mt-4 max-w-2xl text-lg text-secondary-foreground">
          Pick a lesson, read the idea, then write code to solve the task. Press Run to test it.
        </p>
        <div className="mt-6 inline-flex rounded-xl border border-border bg-white/5 p-1" role="group" aria-label="Lesson mode">
          {(["manual", "guided"] as const).map((value) => (
            <button key={value} onClick={() => setMode(value)} className={`rounded-lg px-4 py-2 font-display text-sm capitalize transition-colors ${mode === value ? "bg-accent-teal text-ink" : "text-secondary-foreground hover:bg-white/10"}`}>
              {value === "guided" ? <RouteIcon className="mr-2 inline-block size-4" /> : null}{value} Mode
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {LESSONS.map((l, idx) => (
            <button
              key={l.id}
              onClick={() => setI(idx)}
              className={`rounded-xl border px-4 py-2 font-display text-sm transition-colors ${
                idx === i ? "border-accent-teal bg-accent-teal/15 text-accent-teal" : "border-border bg-white/5 hover:bg-white/10"
              }`}
            >
              {done[l.id] ? "✓ " : ""}
              {l.title}
            </button>
          ))}
        </div>
      </section>

      <div className="glass-panel mb-5 grid gap-4 rounded-3xl p-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="text-[10px] tracking-wider text-muted-foreground uppercase">Concept · {lesson.concept}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">{lesson.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">{lesson.explain}</p>
        </div>
        <div className="rounded-2xl border border-accent-teal/40 bg-accent-teal/10 p-4">
          <p className="text-[10px] tracking-wider text-accent-teal uppercase">Your task</p>
          <p className="mt-1 text-sm">{lesson.task}</p>
          {done[lesson.id] ? (
            <p className="mt-3 text-sm font-semibold text-accent-teal">✓ Solved!</p>
          ) : showHint ? (
            <code className="mt-3 block rounded bg-ink-deep/60 p-2 font-mono text-xs text-accent-sky">{lesson.hint}</code>
          ) : (
            <button onClick={() => setShowHint(true)} className="mt-3 text-xs text-muted-foreground underline underline-offset-4">
              Show hint
            </button>
          )}
          {done[lesson.id] && i < LESSONS.length - 1 && (
            <button onClick={() => setI(i + 1)} className="mt-3 block rounded-lg bg-accent-teal px-4 py-2 font-display text-sm font-semibold text-ink">
              Next lesson →
            </button>
          )}
        </div>
      </div>

      {mode === "guided" && !done[lesson.id] && (
        <div className="glass-panel mb-5 rounded-3xl border-accent-sky/30 p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-sky/15 text-accent-sky"><LockKeyhole /></div>
            <div className="flex-1">
              <p className="text-[10px] tracking-wider text-accent-sky uppercase">Step {i + 1} checkpoint</p>
              <h3 className="mt-1 font-display text-lg font-semibold">Write the first command</h3>
              <p className="mt-1 text-sm text-secondary-foreground">Type the exact command that starts this lesson. The simulator unlocks when it matches.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input aria-label="Checkpoint command" value={checkpoint} onChange={(e) => setCheckpoint(e.target.value)} placeholder="e.g. drive(2)" className="rounded-lg border border-border bg-ink-deep/70 px-3 py-2 font-mono text-sm outline-none focus:border-accent-teal" />
                <span className={`rounded-lg px-3 py-2 text-xs ${checkpointPassed ? "bg-accent-teal/15 text-accent-teal" : "bg-white/5 text-muted-foreground"}`}>{checkpointPassed ? "Checkpoint passed" : "Waiting for exact command"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={checkpointPassed ? "" : "pointer-events-none opacity-50"} aria-disabled={!checkpointPassed}>
        <SimWorkbench key={lesson.id} level={lesson.level} starter={lesson.starter} onFinish={(f) => finish(lesson.check(f))} />
      </div>
    </>
  );
}
