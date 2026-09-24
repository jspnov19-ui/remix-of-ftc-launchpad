import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FTC Simulator — Code a Robot, Feel FTC | Cognition 19655" },
      {
        name: "description",
        content:
          "A free guided FIRST Tech Challenge simulator for FLL members and beginners: learn the 2026-27 field, match structure, and write your first autonomous code with a demo robot.",
      },
      { property: "og:title", content: "FTC Simulator — Code a Robot, Feel FTC" },
      {
        property: "og:description",
        content:
          "Learn how FTC works and program a demo robot on the 2026-27 field. Built by FTC Team Cognition 19655.",
      },
    ],
  }),
  component: Index,
});

const steps = [
  {
    n: "1",
    title: "The field, explained",
    body: "Explore the 2026–27 arena, the goal zone, the samples, and the rules that shape every strategy — no prior experience needed.",
    tone: "sky" as const,
  },
  {
    n: "2",
    title: "Code with a demo robot",
    body: "Drive a sample robot and edit real autonomous commands with live feedback — learn how a line of code actually moves a machine.",
    tone: "teal" as const,
  },
  {
    n: "3",
    title: "From FLL to FTC",
    body: "A friendly bridge for FLL members and juniors: what changes, what stays, and how to make your first team.",
    tone: "plain" as const,
  },
];

const phases = [
  { name: "Autonomous", time: "0:30", body: "No drivers. The robot runs only the code you wrote." },
  { name: "Teleop", time: "2:00", body: "Two drivers per alliance use gamepads to score." },
  { name: "Endgame", time: "0:30", body: "Last 30 seconds — parking and endgame scoring." },
];

export default function Index() {
  return (
    <>
      <section className="pt-14 pb-10">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1 text-[11px] tracking-[0.2em] text-accent-sky uppercase backdrop-blur-md">
              2026–27 season · free to learn
            </span>
            <h1 className="mt-5 font-display text-5xl leading-[1.03] font-semibold md:text-6xl">
              Code a robot.
              <br />
              <span className="text-accent-teal">Feel FTC.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-secondary-foreground">
              A guided simulator for juniors and FLL members with little robotics experience — walk
              through the field, the rules, and your first autonomous code with a demo robot you can
              drive.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/simulation"
                className="rounded-xl bg-accent-teal px-5 py-3 font-display font-semibold text-ink shadow-[0_0_30px_-4px_oklch(0.79_0.125_182/0.6)]"
              >
                Start the simulation
              </Link>
              <Link
                to="/about"
                className="rounded-xl border border-border bg-white/5 px-5 py-3 font-display backdrop-blur-md"
              >
                Meet team Cognition
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-8">
              {[
                { v: "3", l: "Guided pages" },
                { v: "2026–27", l: "Field sim" },
                { v: "Demo", l: "Robot + code" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="font-display text-2xl font-semibold">{s.v}</p>
                  <p className="mt-1 text-xs tracking-wider text-muted-foreground uppercase">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="glass-panel overflow-hidden rounded-3xl">
              <div className="flex items-center gap-2 border-b border-border bg-white/5 px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-tape/70" />
                <span className="size-2.5 rounded-full bg-amber-400/70" />
                <span className="size-2.5 rounded-full bg-accent-teal/80" />
                <span className="ml-2 text-[11px] text-secondary-foreground">
                  field-2026-27.sim
                </span>
              </div>
              <div className="relative aspect-[4/3]">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 120%,oklch(0.79 0.125 182/0.25),transparent 60%),radial-gradient(circle at 20% 0%,oklch(0.63 0.185 259/0.3),transparent 55%),oklch(0.21 0.034 254)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
                    backgroundSize: "26px 26px",
                  }}
                />
                <div className="absolute top-3 left-1/2 grid h-8 w-16 -translate-x-1/2 place-items-center rounded-md border-2 border-accent-teal/70 bg-accent-teal/10 text-[9px] tracking-wider text-accent-teal uppercase">
                  Goal
                </div>
                <div className="absolute top-6 right-4 size-3 rounded-full bg-accent-sky/80" />
                <div className="absolute top-10 right-10 size-3 rounded-full bg-accent-sky/80" />
                <div className="absolute bottom-6 left-1/2 grid size-9 -translate-x-1/2 place-items-center rounded-md bg-glass/90 shadow-[0_0_30px_-2px_oklch(0.79_0.125_182/0.8)]">
                  <span className="text-[8px] font-bold text-ink">ROBOT</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 p-3">
                {[
                  { l: "Mode", v: "Autonomous", c: "" },
                  { l: "Score", v: "12", c: "text-accent-teal" },
                  { l: "Time", v: "18.2s", c: "" },
                ].map((m) => (
                  <div key={m.l} className="rounded-lg border border-border bg-white/5 px-3 py-2">
                    <p className="text-[10px] tracking-wider text-muted-foreground uppercase">
                      {m.l}
                    </p>
                    <p className={`text-sm font-semibold ${m.c}`}>{m.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="glass-panel rounded-2xl p-6">
            <div
              className={`grid size-10 place-items-center rounded-xl border font-display font-bold ${
                s.tone === "sky"
                  ? "border-accent-sky/30 bg-accent-sky/20 text-accent-sky"
                  : s.tone === "teal"
                    ? "border-accent-teal/30 bg-accent-teal/20 text-accent-teal"
                    : "border-border bg-white/10"
              }`}
            >
              {s.n}
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">{s.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 glass-panel rounded-3xl p-7 md:p-9">
        <h2 className="font-display text-2xl font-semibold">How a match runs</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-secondary-foreground">
          Two alliances of two teams each play a two-and-a-half minute match. Everything you write in
          the simulator belongs to the first 30 seconds — the part where the robot is on its own.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {phases.map((p) => (
            <div key={p.name} className="rounded-2xl border border-border bg-white/5 p-5">
              <div className="flex items-baseline justify-between">
                <p className="font-display font-semibold">{p.name}</p>
                <span className="text-xs text-accent-teal">{p.time}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 glass-panel rounded-3xl p-7 md:p-9">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold">A peek at the simulation</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-secondary-foreground">
              Write your first autonomous routine and watch the demo robot respond on the field. Edit
              one value, run it, and see the score change instantly.
            </p>
            <Link
              to="/simulation"
              className="mt-5 inline-block rounded-xl bg-accent-teal px-5 py-3 font-display font-semibold text-ink"
            >
              Open the simulator
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-ink-deep/60 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="text-[11px] text-muted-foreground">autonomous.java</span>
              <span className="text-[10px] text-accent-teal">◉ running</span>
            </div>
            <pre className="overflow-x-auto p-4 text-[12.5px] leading-relaxed text-secondary-foreground">
              <code>
                <span className="text-muted-foreground">{"// move to the goal zone"}</span>
                {"\ndrive("}
                <span className="text-accent-sky">2</span>
                {")\nturn("}
                <span className="text-accent-sky">90</span>
                {")\nclaw("}
                <span className="text-amber-300">close</span>
                {")\narm("}
                <span className="text-amber-300">up</span>
                {")\n"}
                <span className="text-muted-foreground">{"// score the sample"}</span>
                {"\nscore()"}
              </code>
            </pre>
          </div>
        </div>
      </section>
    </>
  );
}
