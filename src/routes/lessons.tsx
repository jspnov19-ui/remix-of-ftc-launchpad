import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SimWorkbench } from "@/components/sim-workbench";
import { GuidedLesson } from "@/components/guided-lesson";
import { LESSONS } from "@/lib/lessons";
import type { Frame } from "@/lib/sim";

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

type Mode = "manual" | "guided";

function Lessons() {
  const [mode, setMode] = useState<Mode>("manual");
  const [i, setI] = useState(0);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const lesson = LESSONS[i]!;

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem("c19-lessons") || "{}"));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => setShowHint(false), [i]);

  const finish = (ok: boolean) => {
    if (!ok || done[lesson.id]) return;
    const next = { ...done, [lesson.id]: true };
    setDone(next);
    localStorage.setItem("c19-lessons", JSON.stringify(next));
  };

  const handleGuidedFinish = (f: Frame) => {
    finish(lesson.check(f));
  };

  const completed = LESSONS.filter((l) => done[l.id]).length;

  return (
    <>
      <section className="pt-14 pb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex rounded-full border border-border bg-white/5 px-3 py-1 text-[11px] tracking-[0.2em] text-accent-sky uppercase">
            {completed}/{LESSONS.length} complete
          </span>
          {/* Mode toggle */}
          <div className="flex rounded-xl border border-border bg-white/5 p-1">
            <button
              onClick={() => setMode("manual")}
              className={`rounded-lg px-4 py-1.5 font-display text-sm transition-colors ${
                mode === "manual" ? "bg-accent-teal/20 text-accent-teal" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Manual Mode
            </button>
            <button
              onClick={() => setMode("guided")}
              className={`rounded-lg px-4 py-1.5 font-display text-sm transition-colors ${
                mode === "guided" ? "bg-accent-teal/20 text-accent-teal" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Guided Mode
            </button>
          </div>
        </div>
        <h1 className="mt-5 font-display text-4xl font-semibold md:text-5xl">Learn to code an FTC robot</h1>
        <p className="mt-4 max-w-2xl text-lg text-secondary-foreground">
          {mode === "manual"
            ? "Pick a lesson, read the concept, then write code to solve the task. Press Run to test it."
            : "Follow the step-by-step wizard. Each lesson breaks concepts into bite-sized steps with interactive coding checkpoints."}
        </p>
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

      {mode === "manual" ? (
        <>
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

          <SimWorkbench key={lesson.id} level={lesson.level} starter={lesson.starter} onFinish={(f) => finish(lesson.check(f))} />
        </>
      ) : (
        <GuidedLesson key={lesson.id} lesson={lesson} onFinish={handleGuidedFinish} />
      )}
    </>
  );
}
