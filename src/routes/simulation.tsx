import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SimWorkbench } from "@/components/sim-workbench";
import { MISSIONS } from "@/lib/missions";

export const Route = createFileRoute("/simulation")({
  head: () => ({
    meta: [
      { title: "Robot Simulation — 2026-27 Field | Cognition 19655" },
      {
        name: "description",
        content:
          "Write an autonomous program, then take on 10 FTC missions of increasing difficulty on a realistic top-down field.",
      },
      { property: "og:title", content: "Robot Simulation — 2026-27 FTC Field" },
      {
        property: "og:description",
        content: "Run the demo robot, then unlock 10 autonomous missions from easy to championship level.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Simulation,
});

const KEY = "c19-missions";
const BLANK = "// Write your autonomous here\n";

function Simulation() {
  const [sel, setSel] = useState(-1); // -1 = demo
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch {
      /* ignore */
    }
  }, []);

  const mark = (id: string) => {
    if (done[id]) return;
    const next = { ...done, [id]: true };
    setDone(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const unlocked = (i: number) => (i === 0 ? !!done.demo : !!done[MISSIONS[i - 1]!.id]);
  const mission = sel >= 0 ? MISSIONS[sel]! : null;
  const curId = mission ? mission.id : "demo";
  const count = MISSIONS.filter((m) => done[m.id]).length;

  return (
    <>
      <section className="pt-14 pb-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1 text-[11px] tracking-[0.2em] text-accent-sky uppercase backdrop-blur-md">
          Missions {count}/{MISSIONS.length} complete
        </span>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] font-semibold md:text-5xl">
          Program the robot
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-secondary-foreground">
          Run the demo first to unlock 10 missions that get harder as you go. Press Run or Step to test
          your code. New to coding?{" "}
          <Link to="/lessons" className="text-accent-teal underline underline-offset-4">
            Start with the lessons
          </Link>
          .
        </p>
      </section>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setSel(-1)}
          className={`rounded-xl border px-4 py-2 font-display text-sm ${
            sel === -1 ? "border-accent-teal bg-accent-teal/15 text-accent-teal" : "border-border bg-white/5 hover:bg-white/10"
          }`}
        >
          {done.demo ? "✓ " : ""}Demo
        </button>
        {MISSIONS.map((m, i) => {
          const open = unlocked(i);
          return (
            <button
              key={m.id}
              disabled={!open}
              onClick={() => setSel(i)}
              title={open ? m.title : "Finish the previous mission to unlock"}
              className={`rounded-xl border px-3 py-2 font-display text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                sel === i ? "border-accent-teal bg-accent-teal/15 text-accent-teal" : "border-border bg-white/5 hover:bg-white/10"
              }`}
            >
              {done[m.id] ? "✓ " : open ? "" : "🔒 "}
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="glass-panel mb-5 flex flex-col gap-3 rounded-3xl p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] tracking-wider text-muted-foreground uppercase">
            {mission ? `Mission ${sel + 1} · ${"★".repeat(mission.difficulty)}${"☆".repeat(5 - mission.difficulty)}` : "Demo mission"}
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold">{mission ? mission.title : "Watch the demo auto"}</h2>
          <p className="mt-1 text-sm text-secondary-foreground">
            {mission ? mission.task : "Press Run to watch the sample get scored and unlock Mission 1."}
          </p>
        </div>
        {done[curId] && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-accent-teal">✓ Complete!</span>
            {sel < MISSIONS.length - 1 && (
              <button
                onClick={() => setSel(sel + 1)}
                className="rounded-lg bg-accent-teal px-4 py-2 font-display text-sm font-semibold text-ink"
              >
                Next mission →
              </button>
            )}
          </div>
        )}
      </div>

      {mission ? (
        <SimWorkbench
          key={mission.id}
          level={mission.level}
          starter={BLANK}
          onFinish={(f) => mission.check(f) && mark(mission.id)}
        />
      ) : (
        <SimWorkbench key="demo" onFinish={(f) => f.score >= 12 && mark("demo")} />
      )}
    </>
  );
}
