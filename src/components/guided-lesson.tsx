import { useState, useMemo } from "react";
import { SimWorkbench } from "@/components/sim-workbench";
import type { GuidedStep, Lesson } from "@/lib/lessons";
import type { Frame } from "@/lib/sim";

function normalize(s: string): string {
  return s
    .replace(/\/\/.*$/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\(\s*/g, "(")
    .replace(/\s*\)/g, ")");
}

export function GuidedLesson({
  lesson,
  onFinish,
}: {
  lesson: Lesson;
  onFinish: (f: Frame) => void;
}) {
  const steps = lesson.guided;
  const [stepIdx, setStepIdx] = useState(0);
  const [source, setSource] = useState(lesson.starter);
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState(false);

  const step = steps[stepIdx]!;
  const isLast = stepIdx === steps.length - 1;

  const checkpointPassed = useMemo(() => {
    if (step.kind !== "checkpoint") return true;
    return normalize(source) === normalize(step.expect);
  }, [step, source]);

  const next = () => {
    if (isLast) return;
    setShowHint(false);
    setStepIdx((i) => i + 1);
  };

  const handleFinish = (f: Frame) => {
    if (lesson.check(f)) {
      setCompleted(true);
      onFinish(f);
    }
  };

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= stepIdx ? "bg-accent-teal" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Step card */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex items-start gap-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-accent-teal/30 bg-accent-teal/15 font-display font-bold text-accent-teal">
            {stepIdx + 1}
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">{step.body}</p>
          </div>
        </div>

        {step.kind === "checkpoint" && (
          <div className="mt-5 rounded-2xl border border-accent-teal/40 bg-accent-teal/10 p-4">
            <p className="text-[10px] tracking-wider text-accent-teal uppercase">Coding checkpoint</p>
            <p className="mt-1 text-sm">{step.prompt}</p>
            <div className="mt-3 flex items-center gap-3">
              {checkpointPassed ? (
                <span className="text-sm font-semibold text-accent-teal">✓ Correct! Press Next to continue.</span>
              ) : showHint ? (
                <code className="rounded bg-ink-deep/60 p-2 font-mono text-xs text-accent-sky">{step.hint}</code>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-xs text-muted-foreground underline underline-offset-4"
                >
                  Need a hint?
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Step {stepIdx + 1} of {steps.length}
          </span>
          {step.kind === "checkpoint" ? (
            <button
              onClick={next}
              disabled={!checkpointPassed}
              className="rounded-xl bg-accent-teal px-5 py-2.5 font-display font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLast ? "Finish" : "Next →"}
            </button>
          ) : isLast ? (
            <span className="text-sm font-semibold text-accent-teal">
              {completed ? "✓ Lesson complete!" : "Run your code below to finish"}
            </span>
          ) : (
            <button
              onClick={next}
              className="rounded-xl bg-accent-teal px-5 py-2.5 font-display font-semibold text-ink"
            >
              Next →
            </button>
          )}
        </div>
      </div>

      {/* The simulator with controlled source */}
      <SimWorkbench
        level={lesson.level}
        starter={source}
        externalSource={source}
        onSourceChange={setSource}
        onFinish={handleFinish}
      />
    </div>
  );
}
