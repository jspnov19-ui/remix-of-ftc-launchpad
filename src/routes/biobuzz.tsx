import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bug, Gamepad2, Keyboard, Sparkles, Target, Zap } from "lucide-react";
import { FieldView3D } from "@/components/field-3d/field-3d";
import { SimWorkbench } from "@/components/sim-workbench";
import { FIELD_TILES, runProgram, type Frame, type Level } from "@/lib/sim";

export const Route = createFileRoute("/biobuzz")({
  head: () => ({
    meta: [
      { title: "BioBuzz | Cognition 19655" },
      { name: "description", content: "Drive the Cognition robot through a pollination-themed FTC field in teleop or autonomous mode." },
    ],
  }),
  component: BioBuzz,
});

const BIO_LEVEL: Level = { start: { x: 1, y: 5 }, sample: { x: 1, y: 3 }, goal: { x: 3, y: 1 } };
const AUTO = "drive(2)      // roll to the pollen\nintake(in)    // suck it up\ndrive(2)\nturn(90)\ndrive(2)      // into the nectar box\naim(15)\npower(80)\nscore()";

const initialFrame = (): Frame => ({ ...runProgram("", BIO_LEVEL).frames[0]!, label: "System Ready" });
const MAX = FIELD_TILES - 1;

function BioBuzz() {
  const [mode, setMode] = useState<"teleop" | "autonomous">("teleop");
  const [teleop, setTeleop] = useState<Frame>(initialFrame);

  useEffect(() => {
    if (mode !== "teleop") return;
    let animationId = 0;
    let last = performance.now();
    const held = new Set<string>();
    let intakeOn = false;
    let fire = false;
    const KEYS = ["w", "a", "s", "d", "arrowleft", "arrowright", "i", "k", "j", "u", "l", "n", "m"];

    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!KEYS.includes(key)) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      if (e.repeat) return;
      if (key === "j" || key === "u") intakeOn = !intakeOn;
      else if (key === "l" || key === "n") fire = true;
      else if (key === "m") intakeOn = false;
      held.add(key);
    };
    const onUp = (e: KeyboardEvent) => held.delete(e.key.toLowerCase());

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      setTeleop((c) => {
        const speed = 2.2 * dt; // tiles per second
        const turn = 160 * dt;
        let heading = c.heading;
        if (held.has("arrowleft")) heading -= turn;
        if (held.has("arrowright")) heading += turn;
        heading = ((heading % 360) + 360) % 360;
        const rad = (heading * Math.PI) / 180;
        const fx = Math.sin(rad), fy = -Math.cos(rad);
        const rx = Math.cos(rad), ry = Math.sin(rad);
        let x = c.x, y = c.y;
        if (held.has("w")) { x += fx * speed; y += fy * speed; }
        if (held.has("s")) { x -= fx * speed; y -= fy * speed; }
        if (held.has("d")) { x += rx * speed; y += ry * speed; }
        if (held.has("a")) { x -= rx * speed; y -= ry * speed; }
        x = Math.max(0, Math.min(MAX, x));
        y = Math.max(0, Math.min(MAX, y));

        let { holding, taken, score } = c;
        let label = held.size ? "Driving" : "Waiting for input…";
        const sample = BIO_LEVEL.sample!;
        if (intakeOn && !holding && !taken.includes(0) && Math.hypot(x - sample.x, y - sample.y) < 0.5) {
          holding = true;
          taken = [0];
          label = "Pollen collected!";
        }
        if (fire) {
          fire = false;
          if (holding) {
            holding = false;
            const goal = BIO_LEVEL.goal!;
            if (Math.hypot(x - goal.x, y - goal.y) < 0.6) {
              score += 12;
              label = "Scored in the nectar box! +12";
            } else {
              taken = [];
              label = "Missed — pollen returned to its mark";
            }
          } else label = "Launcher empty";
        }
        const power = held.has("i") ? Math.min(100, c.power + 60 * dt) : held.has("k") ? Math.max(0, c.power - 60 * dt) : c.power;
        return { ...c, x, y, heading, holding, taken, score, label, power, intake: intakeOn ? "in" : "idle" };
      });
      animationId = requestAnimationFrame(tick);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    animationId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
      cancelAnimationFrame(animationId);
    };
  }, [mode]);

  const reset = () => setTeleop({ ...initialFrame(), label: "Robot reset" });

  return (
    <>
      <section className="pt-14 pb-7">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-teal/40 bg-accent-teal/10 px-3 py-1 text-[11px] tracking-[0.2em] text-accent-teal uppercase"><Bug className="size-3" /> BioBuzz field</span>
          <span className="text-xs text-muted-foreground">2026–27 season sandbox</span>
        </div>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.05] md:text-6xl">Make the field come alive.</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-secondary-foreground">Pilot the robot through a pollination-inspired field, then switch to autonomous and write the route that scores the nectar.</p>
      </section>

      <div className="mb-5 inline-flex rounded-xl border border-border bg-white/5 p-1" role="group">
        <button onClick={() => setMode("teleop")} className={`rounded-lg px-5 py-2.5 font-display text-sm ${mode === "teleop" ? "bg-accent-teal text-ink" : "text-secondary-foreground hover:bg-white/10"}`}><Gamepad2 className="mr-2 inline-block size-4" />Teleop</button>
        <button onClick={() => setMode("autonomous")} className={`rounded-lg px-5 py-2.5 font-display text-sm ${mode === "autonomous" ? "bg-accent-teal text-ink" : "text-secondary-foreground hover:bg-white/10"}`}><Sparkles className="mr-2 inline-block size-4" />Autonomous</button>
      </div>

      {mode === "teleop" ? (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="glass-panel overflow-hidden rounded-3xl lg:col-span-8">
            <div className="flex items-center justify-between border-b border-border bg-white/5 px-4 py-3"><span className="font-display text-sm font-semibold">Pollination field</span><button onClick={reset} className="text-xs text-muted-foreground underline underline-offset-4">Reset robot</button></div>
            <div className="aspect-square bg-ink-deep p-2"><FieldView3D frame={teleop} level={BIO_LEVEL} variant="biobuzz" /></div>
          </div>
          <aside className="glass-panel flex flex-col gap-5 rounded-3xl p-6 lg:col-span-4">
            <div><p className="text-[10px] tracking-wider text-accent-teal uppercase">Teleop controls</p><h2 className="mt-2 font-display text-2xl font-semibold">Pilot the bot</h2><p className="mt-2 text-sm leading-relaxed text-secondary-foreground">Keyboard controls are active while this mode is selected.</p></div>
            <div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl border border-border bg-white/5 p-3"><Keyboard className="mb-2 size-4 text-accent-sky" /><b>WASD</b><p className="mt-1 text-muted-foreground">drive / strafe</p></div><div className="rounded-xl border border-border bg-white/5 p-3"><Target className="mb-2 size-4 text-accent-sky" /><b>Arrows</b><p className="mt-1 text-muted-foreground">turn + aim</p></div><div className="rounded-xl border border-border bg-white/5 p-3"><b className="font-mono text-accent-teal">J / U</b><p className="mt-1 text-muted-foreground">toggle intake</p></div><div className="rounded-xl border border-border bg-white/5 p-3"><b className="font-mono text-accent-teal">L / N</b><p className="mt-1 text-muted-foreground">launch ball</p></div><div className="rounded-xl border border-border bg-white/5 p-3"><Zap className="mb-2 size-4 text-amber-300" /><b>I / K</b><p className="mt-1 text-muted-foreground">power + / −</p></div><div className="rounded-xl border border-border bg-white/5 p-3"><b className="font-mono text-accent-teal">M</b><p className="mt-1 text-muted-foreground">stop rollers</p></div></div>
            <div className="rounded-xl border border-accent-sky/20 bg-accent-sky/10 p-4 text-sm"><p className="text-[10px] tracking-wider text-accent-sky uppercase">Live status</p><p className="mt-2 font-semibold">{teleop.label}</p><p className="mt-1 text-secondary-foreground">X: {teleop.x.toFixed(2)} · Z: {teleop.y.toFixed(2)} · Heading {teleop.heading.toFixed(0)}°</p><p className="mt-1 text-secondary-foreground">Inventory: {teleop.holding ? "Carrying Element" : "Empty Rollers"}</p><p className="mt-1 text-secondary-foreground">Score: {teleop.score} · Power: {Math.round(teleop.power)}% · Active Rollers: {teleop.intake}</p></div>
          </aside>
        </div>
      ) : (
        <div><div className="mb-5 rounded-2xl border border-accent-teal/30 bg-accent-teal/10 p-4 text-sm text-secondary-foreground">Autonomous console: edit the program, then run it to see pollen collection and nectar scoring on the BioBuzz field.</div><SimWorkbench level={BIO_LEVEL} starter={AUTO} variant="biobuzz" /></div>
      )}
    </>
  );
}
