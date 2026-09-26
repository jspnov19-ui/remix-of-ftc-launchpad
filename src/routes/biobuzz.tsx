import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bug, Gamepad2, Keyboard, Sparkles, Target, Zap } from "lucide-react";
import { FieldView3D } from "@/components/field-3d/field-3d";
import { SimWorkbench } from "@/components/sim-workbench";
import { DEMO_LEVEL, runProgram, type Frame } from "@/lib/sim";

export const Route = createFileRoute("/biobuzz")({
  head: () => ({
    meta: [
      { title: "BioBuzz | Cognition 19655" },
      { name: "description", content: "Drive the Cognition robot through a pollination-themed FTC field in teleop or autonomous mode." },
    ],
  }),
  component: BioBuzz,
});

const BIO_LEVEL = { start: { x: 1, y: 5 }, sample: { x: 2, y: 3 }, goal: { x: 4, y: 1 } };
const AUTO = "drive(2)\nintake(in)\naim(15)\npower(80)\nturn(90)\ndrive(2)\nintake(out)\nscore()";

function BioBuzz() {
  const [mode, setMode] = useState<"teleop" | "autonomous">("teleop");
  const [teleop, setTeleop] = useState<Frame>(() => runProgram("", BIO_LEVEL).frames[0]!);
  const [pressed, setPressed] = useState<string[]>([]);

  useEffect(() => {
    if (mode !== "teleop") return;
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!["w", "a", "s", "d", "arrowleft", "arrowright", "i", "k", "o", "p", "j", "l", "u", "n", "m"].includes(key)) return;
      event.preventDefault();
      setPressed((current) => current.includes(key) ? current : [...current, key]);
      setTeleop((current) => {
        let x = current.x;
        let y = current.y;
        let heading = current.heading;
if (key === "w") y = Math.min(5, y + 1);
    if (key === "s") y = Math.max(0, y - 1);
        if (key === "a") x = Math.max(0, x - 1);
        if (key === "d") x = Math.min(5, x + 1);
        if (key === "arrowleft") heading -= 15;
        if (key === "arrowright") heading += 15;
        return { ...current, x, y, heading, arm: key === "i" ? "up" : key === "k" ? "down" : current.arm, claw: key === "o" ? "closed" : key === "p" ? "open" : current.claw, intake: ["j", "u"].includes(key) ? "in" : ["l", "n"].includes(key) ? "out" : key === "m" ? "idle" : current.intake, aim: key === "arrowleft" ? Math.max(-45, current.aim - 5) : key === "arrowright" ? Math.min(45, current.aim + 5) : current.aim, power: key === "i" ? Math.min(100, current.power + 10) : key === "k" ? Math.max(0, current.power - 10) : current.power, holding: ["j", "u"].includes(key) && !current.holding && current.x === 2 && current.y === 3 ? true : current.holding, label: `Teleop: ${event.key}`, note: "WASD drives. Arrows turn and aim. J/U intake, L/N outtake, I/K power." };
      });
    };
    const onUp = (event: KeyboardEvent) => setPressed((current) => current.filter((key) => key !== event.key.toLowerCase()));
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onUp); };
  }, [mode]);

  const reset = () => setTeleop(runProgram("", BIO_LEVEL).frames[0]!);

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

      <div className="mb-5 inline-flex rounded-xl border border-border bg-white/5 p-1" role="group" aria-label="BioBuzz control mode">
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
            <div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl border border-border bg-white/5 p-3"><Keyboard className="mb-2 size-4 text-accent-sky" /><b>WASD</b><p className="mt-1 text-muted-foreground">drive / strafe</p></div><div className="rounded-xl border border-border bg-white/5 p-3"><Target className="mb-2 size-4 text-accent-sky" /><b>Arrows</b><p className="mt-1 text-muted-foreground">turn + aim</p></div><div className="rounded-xl border border-border bg-white/5 p-3"><b className="font-mono text-accent-teal">J / U</b><p className="mt-1 text-muted-foreground">intake ball</p></div><div className="rounded-xl border border-border bg-white/5 p-3"><b className="font-mono text-accent-teal">L / N</b><p className="mt-1 text-muted-foreground">outtake ball</p></div><div className="rounded-xl border border-border bg-white/5 p-3"><Zap className="mb-2 size-4 text-amber-300" /><b>I / K</b><p className="mt-1 text-muted-foreground">power + / −</p></div><div className="rounded-xl border border-border bg-white/5 p-3"><b className="font-mono text-accent-teal">M</b><p className="mt-1 text-muted-foreground">stop rollers</p></div></div>
            <div className="rounded-xl border border-accent-sky/20 bg-accent-sky/10 p-4 text-sm"><p className="text-[10px] tracking-wider text-accent-sky uppercase">Live status</p><p className="mt-2 font-semibold">{teleop.label}</p><p className="mt-1 text-secondary-foreground">Tile {teleop.x + 1}, {6 - teleop.y} · Heading {teleop.heading}°</p><p className="mt-1 text-secondary-foreground">Aim {teleop.aim}° · Power {teleop.power}% · Rollers {teleop.intake}</p><p className="mt-2 text-xs text-muted-foreground">{pressed.length ? `Pressed: ${pressed.join(", ")}` : "Waiting for input"}</p></div>
          </aside>
        </div>
      ) : (
        <div><div className="mb-5 rounded-2xl border border-accent-teal/30 bg-accent-teal/10 p-4 text-sm text-secondary-foreground">Autonomous console: edit the program, then run it to see pollen collection and nectar scoring on the BioBuzz field.</div><SimWorkbench level={BIO_LEVEL} starter={AUTO} variant="biobuzz" /></div>
      )}
    </>
  );
}
