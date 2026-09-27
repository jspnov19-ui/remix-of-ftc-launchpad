import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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

const initialFrame = (): Frame => ({ ...runProgram("", BIO_LEVEL).frames!, label: "System Ready" });
const MAX = FIELD_TILES - 1;

const BALL_CAP = 3; // FTC BioBuzz inventory cap — exactly 3 per rules
const PICKUP_DIST = 0.45; // tiles
// y(t) = y0 + vy0*t - 0.5*g*t^2. Real g = 9.81 m/s²; this sim's "tile" unit is
// roughly 0.6 m, so GRAVITY is g scaled into tile-space rather than 9.81 directly —
// using 9.81 unscaled here would make every shot drop about twice as fast on screen.
const GRAVITY = 4.9;
const HIVE = { x: (FIELD_TILES - 1) / 2, y: (FIELD_TILES - 1) / 2 }; // field center
const HIVE_RADIUS = 0.7;

type Ball = { id: number; x: number; y: number; h: number; vx: number; vy: number; vh: number; flying: boolean };
let ballId = 0;
const floorBall = (x: number, y: number): Ball => ({ id: ballId++, x, y, h: 0, vx: 0, vy: 0, vh: 0, flying: false });
const starterBalls = () => [floorBall(1, 3), floorBall(4, 4), floorBall(0.5, 1.5)];

function BioBuzz() {
  const [mode, setMode] = useState<"teleop" | "autonomous">("teleop");
  const [teleop, setTeleop] = useState<Frame>(initialFrame);
  const [balls, setBalls] = useState<Ball[]>(starterBalls);
  const [inv, setInv] = useState(0);
  const ballsRef = useRef<Ball[]>(balls);
  const invRef = useRef(0);
  const frameRef = useRef<Frame>(teleop);
  const powerRef = useRef(60);
  const outtakeUntilRef = useRef(0);
  const scorePulseRef = useRef(0);
  const [scorePulse, setScorePulse] = useState(0);

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
      const c = frameRef.current;
      const speed = 2.2 * dt;
      let heading = c.heading;
      if (held.has("arrowleft")) heading -= 160 * dt;
      if (held.has("arrowright")) heading += 160 * dt;
      heading = ((heading % 360) + 360) % 360;
      const rad = (heading * Math.PI) / 180;
      // forward / right vectors in field-grid space (matches the 3D robot's facing)
      const forwardX = Math.sin(rad), forwardY = Math.cos(rad);
      const rightX = Math.cos(rad), rightY = -Math.sin(rad);
      let x = c.x, y = c.y;
      if (held.has("w")) { x += forwardX * speed; y += forwardY * speed; }
      if (held.has("s")) { x -= forwardX * speed; y -= forwardY * speed; }
      if (held.has("d")) { x += rightX * speed; y += rightY * speed; }
      if (held.has("a")) { x -= rightX * speed; y -= rightY * speed; }
      x = Math.max(0, Math.min(MAX, x));
      y = Math.max(0, Math.min(MAX, y));
      if (held.has("i")) powerRef.current = Math.min(100, powerRef.current + 60 * dt);
      if (held.has("k")) powerRef.current = Math.max(10, powerRef.current - 60 * dt);

      let label = held.size ? "Driving" : "Waiting for input…";
      let score = c.score;
      let list = ballsRef.current;

      // Intake: pick up floor balls touching the front bumper
      if (intakeOn) {
        const bx = x + forwardX * 0.3, by = y + forwardY * 0.3;
        list = list.filter((b) => {
          if (b.flying || invRef.current >= BALL_CAP) return true;
          if (Math.hypot(b.x - bx, b.y - by) < PICKUP_DIST) { invRef.current++; label = "Pollen collected!"; return false; }
          return true;
        });
        if (invRef.current >= BALL_CAP) label = `Storage full (${BALL_CAP} pollen)`;
      }

      // Fire: spawn a projectile based strictly on robot heading and proportional launch power
      if (fire) {
        fire = false;
        if (invRef.current > 0) {
          invRef.current--;
          outtakeUntilRef.current = now + 350;
          
          // Establish initial launcher position at the center-rear edge of the robot
          const mx = x - forwardX * 0.1, my = y - forwardY * 0.1, mh = 0.45;
          
          // Map slider power directly to forward speed velocity magnitude (Higher % = More power)
          const launchVelocityMagnitude = 2.0 + (powerRef.current / 100) * 4.5;
          
          // Project 3D vector paths strictly utilizing the robot's active heading orientation angle
          const launchAngleElevation = 45 * Math.PI / 180; // fixed shooter angle configuration
          
          list = [...list, {
            id: ballId++, 
            x: mx, 
            y: my, 
            h: mh, 
            flying: true,
            // Split horizontal components along the robot's specific heading direction
            vx: forwardX * Math.cos(launchAngleElevation) * launchVelocityMagnitude, 
            vy: forwardY * Math.cos(launchAngleElevation) * launchVelocityMagnitude,
            // Upward vertical speed vector component
            vh: Math.sin(launchAngleElevation) * launchVelocityMagnitude,
          }];
          
          label = "Launched!";
        } else label = "Launcher empty";
      }

      // Projectile physics loop with custom infinite respawn mapping
      let scoredNow = false;
      list = list.map((b) => {
        if (!b.flying) return b;
        const nb = { ...b, x: b.x + b.vx * dt, y: b.y + b.vy * dt, h: b.h + b.vh * dt, vh: b.vh - GRAVITY * dt };
        
        if (nb.h <= 0 && nb.vh < 0) {
          // IF SCORED: Bump points, pulse field meshes, and instantly respawn a replacement ball on the field matrix
          if (Math.hypot(nb.x - HIVE.x, nb.y - HIVE.y) < HIVE_RADIUS) { 
            score += 5; 
            label = "Scored in the hive! +5"; 
            scoredNow = true; 
            
            const randomX = 0.5 + Math.random() * (MAX - 1.0);
            const randomY = 0.5 + Math.random() * (MAX - 1.0);
            return { ...nb, id: ballId++, x: randomX, y: randomY, h: 0, vx: 0, vy: 0, vh: 0, flying: false };
          }
          // IF MISSED: Bring projectile ball rest values to zero directly where it lands
          return { ...nb, h: 0, vx: 0, vy: 0, vh: 0, flying: false, x: Math.max(0, Math.min(MAX, nb.x)), y: Math.max(0, Math.min(MAX, nb.y)) };
        }
        return nb;
      });

      if (scoredNow) {
        scorePulseRef.current++;
        setScorePulse(scorePulseRef.current);
      }

      // Clean up launcher flash label back to driving state after the 350ms timestamp gate closes
      if (label === "Launched!" && now > outtakeUntilRef.current) {
        label = held.size ? "Driving" : "Waiting for input…";
      }

      ballsRef.current = list;
      const next: Frame = { ...c, x, y, heading, score, label, power: powerRef.current, holding: invRef.current > 0, intake: intakeOn ? "in" : "idle" };
      frameRef.current = next;
      setTeleop(next);
      setBalls(list);
      setInv(invRef.current);
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

  const reset = () => {
    const f = { ...initialFrame(), label: "Robot reset" };
    frameRef.current = f;
    invRef.current = 0;
    ballsRef.current = starterBalls();
    setTeleop(f);
    setInv(0);
    setBalls(ballsRef.current);
  };

  const spawn = () => {
    const fresh = Array.from({ length: 6 }, () => floorBall(0.3 + Math.random() * (MAX - 0.6), 0.3 + Math.random() * (MAX - 0.6)));
    ballsRef.current = [...ballsRef.current, ...fresh];
    setBalls(ballsRef.current);
  };

  // Global telemetry snapshot — single source of truth for the status HUD below.
  const telemetry = {
    status: teleop.label,
    intakeStatus: teleop.intake === "in" ? "INTAKING" : "OFF",
    outtakeStatus: performance.now() < outtakeUntilRef.current ? "LAUNCHING" : "OFF",
    ballsCollected: inv,
    headingDegrees: Math.round(teleop.heading),
  };
  return (
    <>
      <section className="pt-14 pb-7">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-teal/40 bg-accent-teal/10 px-3 py-1 text-[11px] tracking-[0.2em] text-accent-teal uppercase">
            <Bug className="size-3" /> BioBuzz field
          </span>
          <span className="text-xs text-muted-foreground">2026–27 season sandbox</span>
        </div>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.05] md:text-6xl">
          Make the field come alive.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-secondary-foreground">
          Pilot the robot through a pollination-inspired field, then switch to autonomous and write the route that scores the nectar.
        </p>
      </section>

      <div className="mb-5 inline-flex rounded-xl border border-border bg-white/5 p-1" role="group">
        <button 
          onClick={() => setMode("teleop")} 
          className={`rounded-lg px-5 py-2.5 font-display text-sm ${mode === "teleop" ? "bg-accent-teal text-ink" : "text-secondary-foreground hover:bg-white/10"}`}
        >
          <Gamepad2 className="mr-2 inline-block size-4" />Teleop
        </button>
        <button 
          onClick={() => setMode("autonomous")} 
          className={`rounded-lg px-5 py-2.5 font-display text-sm ${mode === "autonomous" ? "bg-accent-teal text-ink" : "text-secondary-foreground hover:bg-white/10"}`}
        >
          <Sparkles className="mr-2 inline-block size-4" />Autonomous
        </button>
      </div>

      {mode === "teleop" ? (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="glass-panel overflow-hidden rounded-3xl lg:col-span-8">
            <div className="flex items-center justify-between border-b border-border bg-white/5 px-4 py-3">
              <span className="font-display text-sm font-semibold">Pollination field</span>
              <button onClick={reset} className="text-xs text-muted-foreground underline underline-offset-4">
                Reset robot
              </button>
            </div>
            <div className="aspect-square bg-ink-deep p-2">
              <FieldView3D frame={teleop} level={BIO_LEVEL} variant="biobuzz" liveBalls={balls} scorePulse={scorePulse} />
            </div>
          </div>
          
          <aside className="glass-panel flex flex-col gap-5 rounded-3xl p-6 lg:col-span-4">
            <div>
              <p className="text-[10px] tracking-wider text-accent-teal uppercase">Teleop controls</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">Pilot the bot</h2>
              <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
                Keyboard controls are active while this mode is selected.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border bg-white/5 p-3">
                <Keyboard className="mb-2 size-4 text-accent-sky" />
                <b>WASD</b>
                <p className="mt-1 text-muted-foreground">drive / strafe</p>
              </div>
              <div className="rounded-xl border border-border bg-white/5 p-3">
                <Target className="mb-2 size-4 text-accent-sky" />
                <b>Arrows</b>
                <p className="mt-1 text-muted-foreground">turn + aim</p>
              </div>
              <div className="rounded-xl border border-border bg-white/5 p-3">
                <b className="font-mono text-accent-teal">J / U</b>
                <p className="mt-1 text-muted-foreground">toggle intake</p>
              </div>
              <div className="rounded-xl border border-border bg-white/5 p-3">
                <b className="font-mono text-accent-teal">L / N</b>
                <p className="mt-1 text-muted-foreground">launch ball</p>
              </div>
              <div className="rounded-xl border border-border bg-white/5 p-3">
                <Zap className="mb-2 size-4 text-amber-300" />
                <b>I / K</b>
                <p className="mt-1 text-muted-foreground">power + / −</p>
              </div>
              <div className="rounded-xl border border-border bg-white/5 p-3">
                <b className="font-mono text-accent-teal">M</b>
                <p className="mt-1 text-muted-foreground">stop rollers</p>
              </div>
            </div>
            
            <div className="rounded-xl border border-accent-sky/20 bg-accent-sky/10 p-4 text-sm">
              <p className="text-[10px] tracking-wider text-accent-sky uppercase">Telemetry</p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs">
                <span className="text-muted-foreground">Status</span>
                <span className="text-right font-semibold">{telemetry.status}</span>
                
                <span className="text-muted-foreground">Intake</span>
                <span className={`text-right font-semibold ${telemetry.intakeStatus === "INTAKING" ? "text-accent-teal" : ""}`}>
                  {telemetry.intakeStatus}
                </span>
                
                <span className="text-muted-foreground">Outtake</span>
                <span className={`text-right font-semibold ${telemetry.outtakeStatus === "LAUNCHING" ? "text-amber-300" : ""}`}>
                  {telemetry.outtakeStatus}
                </span>
                
                <span className="text-muted-foreground">Balls Collected</span>
                <span className="text-right font-semibold">{telemetry.ballsCollected}/{BALL_CAP} MAX</span>
              </div>
              <p className="mt-3 text-secondary-foreground font-mono text-xs">
                X: {teleop.x.toFixed(2)} · Z: {teleop.y.toFixed(2)} · Heading {telemetry.headingDegrees}°
              </p>
              <p className="mt-1 text-secondary-foreground font-mono text-xs">
                Score: {teleop.score} · Power: {Math.round(teleop.power)}%
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <div>
          <div className="mb-5 rounded-2xl border border-accent-teal/30 bg-accent-teal/10 p-4 text-sm text-secondary-foreground">
            Autonomous console: edit the program, then run it to see pollen collection and nectar scoring on the BioBuzz field.
          </div>
          <SimWorkbench level={BIO_LEVEL} starter={AUTO} variant="biobuzz" />
        </div>
      )}
    </>
  );
}
