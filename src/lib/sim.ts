/**
 * Tiny teaching-simulator engine for the 2026-27 FTC demo field.
 *
 * The field is a 6 x 6 tile grid (each tile = one 24" foam tile).
 * Tile (0,0) is the top-left; y grows downward.
 */

export const FIELD_TILES = 6;
export const START = { x: 1, y: 5 };
export const SAMPLE_TILE = { x: 2, y: 3 };
export const GOAL_TILE = { x: 2, y: 1 };

export type Frame = {
  line: number;
  x: number;
  y: number;
  heading: number; // degrees, 0 = facing the goal wall (up)
  arm: "down" | "up";
  claw: "open" | "closed";
  holding: boolean;
  intake: "idle" | "in" | "out";
  aim: number;
  power: number;
  score: number;
  label: string;
  note: string;
  /** virtual seconds elapsed */
  t: number;
  /** robot tried to drive into an obstacle tile */
  crashed: boolean;
  /** indices of samples that were picked up (held or scored) */
  taken: number[];
};

export type Level = {
  start: { x: number; y: number };
  sample: { x: number; y: number } | null;
  goal: { x: number; y: number } | null;
  /** extra samples for multi-delivery missions (sample above is index 0) */
  samples?: { x: number; y: number }[];
  /** forbidden tiles the robot may not enter */
  obstacles?: { x: number; y: number }[];
};

export function levelSamples(level: Level) {
  return [...(level.sample ? [level.sample] : []), ...(level.samples ?? [])];
}

/** Virtual time cost of each command, in seconds. */
export const TIME_COST = { tile: 1, turn90: 0.5, arm: 0.8, claw: 0.5, score: 0.5 };

export const DEMO_LEVEL: Level = { start: START, sample: SAMPLE_TILE, goal: GOAL_TILE };

export type ParseError = { line: number; message: string };

export type Program = {
  frames: Frame[];
  errors: ParseError[];
};

export const DEFAULT_PROGRAM = `// Cognition 19655 — demo autonomous
// 30 seconds, no driver. The robot runs only this list.

drive(2)      // leave the wall, two tiles forward
turn(90)      // point right, toward the sample
drive(1)
claw(close)   // grab the sample
arm(up)       // lift it clear of the floor
turn(-90)     // face the goal again
drive(2)
score()       // release into the goal zone
`;

const baseFrame: Frame = {
  line: 0,
  x: START.x,
  y: START.y,
  heading: 0,
  arm: "down",
  claw: "open",
  holding: false,
  intake: "idle",
  aim: 0,
  power: 0,
  score: 0,
  label: "Robot initialized",
  t: 0,
  crashed: false,
  taken: [],
  note: "Every autonomous program starts from a legal starting position touching the wall. Press Step to run one line at a time, or Run to watch the whole 30 seconds.",
};

function stripComment(raw: string) {
  const i = raw.indexOf("//");
  return (i === -1 ? raw : raw.slice(0, i)).trim();
}

function clamp(n: number) {
  return Math.max(0, Math.min(FIELD_TILES - 1, n));
}

export function runProgram(source: string, level: Level = DEMO_LEVEL): Program {
  const errors: ParseError[] = [];
  const first: Frame = { ...baseFrame, x: level.start.x, y: level.start.y };
  const frames: Frame[] = [first];
  let s: Frame = { ...first };
  const samples = levelSamples(level);
  const blocked = (x: number, y: number) => (level.obstacles ?? []).some((o) => o.x === x && o.y === y);
  const GOAL_TILE = level.goal ?? { x: -9, y: -9 };

  source.split("\n").forEach((raw, idx) => {
    const line = idx + 1;
    const text = stripComment(raw);
    if (!text) return;

    const match = /^([a-zA-Z]+)\s*\(\s*([^)]*?)\s*\)\s*;?$/.exec(text);
    if (!match) {
      errors.push({
        line,
        message: `Can't read "${text}". Commands look like drive(2) or claw(close).`,
      });
      return;
    }

    const name = (match[1] ?? "").toLowerCase();
    const arg = match[2] ?? "";
    const next: Frame = { ...s, line };

    switch (name) {
      case "drive": {
        const tiles = Number(arg);
        if (!Number.isFinite(tiles) || tiles === 0) {
          errors.push({ line, message: "drive() needs a number of tiles, like drive(2)." });
          return;
        }
        const rad = (s.heading * Math.PI) / 180;
        const sx = Math.round(Math.sin(rad)) * Math.sign(tiles);
        const sy = -Math.round(Math.cos(rad)) * Math.sign(tiles);
        let cx = s.x, cy = s.y, moved = 0;
        for (let k = 0; k < Math.abs(tiles); k++) {
          const nx = cx + sx, ny = cy + sy;
          if (nx !== clamp(nx) || ny !== clamp(ny)) break;
          if (blocked(nx, ny)) { next.crashed = true; break; }
          cx = nx; cy = ny; moved++;
        }
        next.x = cx;
        next.y = cy;
        next.t = s.t + Math.max(1, moved) * TIME_COST.tile * (sx !== 0 && sy !== 0 ? 1.4 : 1);
        next.label = `drive(${tiles})`;
        next.note = `Both drive motors run the same direction, so the robot moves ${Math.abs(
          tiles,
        )} tile${Math.abs(tiles) === 1 ? "" : "s"} in a straight line. Encoders count the wheel turns and stop it there.`;
        if (next.crashed)
          next.note = "CRASH! The robot hit a forbidden obstacle tile and stopped. Plan a path around the red zones.";
        break;
      }
      case "turn": {
        const deg = Number(arg);
        if (!Number.isFinite(deg)) {
          errors.push({ line, message: "turn() needs degrees, like turn(90) or turn(-90)." });
          return;
        }
        next.heading = ((s.heading + deg) % 360 + 360) % 360;
        next.t = s.t + (Math.abs(deg) / 90) * TIME_COST.turn90;
        next.label = `turn(${deg})`;
        next.note = `The wheels spin opposite directions so the robot pivots in place ${Math.abs(
          deg,
        )}° to the ${deg >= 0 ? "right" : "left"}. A gyro sensor watches the angle so it stops straight.`;
        break;
      }
      case "arm": {
        const dir = arg.replace(/['"]/g, "").toLowerCase();
        if (dir !== "up" && dir !== "down") {
          errors.push({ line, message: "arm() takes up or down, like arm(up)." });
          return;
        }
        next.arm = dir;
        next.t = s.t + TIME_COST.arm;
        next.label = `arm(${dir})`;
        next.note =
          dir === "up"
            ? "A separate motor lifts the arm. Raising it after grabbing keeps the sample off the tiles while driving."
            : "The arm lowers back down so the claw can reach a sample sitting on the floor.";
        break;
      }
      case "claw": {
        const dir = arg.replace(/['"]/g, "").toLowerCase();
        if (dir !== "open" && dir !== "close") {
          errors.push({ line, message: "claw() takes open or close, like claw(close)." });
          return;
        }
        next.t = s.t + TIME_COST.claw;
        if (dir === "close") {
          next.claw = "closed";
          const idx = samples.findIndex(
            (p, i) => p.x === s.x && p.y === s.y && !s.taken.includes(i),
          );
          const onSample = !s.holding && idx >= 0 && s.arm === "down";
          next.holding = s.holding || onSample;
          if (onSample) next.taken = [...s.taken, idx];
          next.label = "claw(close)";
          next.note = onSample
            ? "The claw servo squeezes shut on the sample. Servos hold a position instead of spinning, which is why they're used for grabbers."
            : "The claw closed on empty air — the robot has to be on the sample tile with the arm down first. Try driving to the yellow tile.";
        } else {
          next.claw = "open";
          next.holding = false;
          if (s.holding) next.taken = s.taken.slice(0, -1); // referee resets it to its mark
          next.label = "claw(open)";
          next.note = s.holding
            ? "The claw opened away from the goal — the sample drops and the referee puts it back on its mark."
            : "The claw opens.";
        }
        break;
      }
      case "intake": {
        const dir = arg.replace(/[\'\"]/g, "").toLowerCase();
        if (dir !== "in" && dir !== "out" && dir !== "stop") {
          errors.push({ line, message: "intake() takes in, out or stop." });
          return;
        }
        next.intake = dir === "stop" ? "idle" : dir;
        next.t = s.t + 0.4;
        if (dir === "in" && !s.holding) {
          const idx = samples.findIndex((p, i) => p.x === s.x && p.y === s.y && !s.taken.includes(i));
          if (idx >= 0) { next.holding = true; next.taken = [...s.taken, idx]; }
        }
        next.label = `intake(${dir})`;
        next.note = dir === "in" ? (next.holding ? "The intake rollers pull the pollen ball into the robot." : "The intake spins, but there is no pollen ball at this tile.") : dir === "out" ? "The intake rollers reverse to eject the held pollen ball." : "The intake rollers stop.";
        break;
      }
      case "aim": {
        const deg = Number(arg);
        if (!Number.isFinite(deg)) { errors.push({ line, message: "aim() needs an angle in degrees." }); return; }
        next.aim = Math.max(-45, Math.min(45, deg));
        next.t = s.t + 0.25;
        next.label = `aim(${deg})`;
        next.note = `The turret turns ${next.aim}° relative to the chassis to line up the shot.`;
        break;
      }
      case "power": {
        const value = Number(arg);
        if (!Number.isFinite(value) || value < 0 || value > 100) { errors.push({ line, message: "power() needs a value from 0 to 100." }); return; }
        next.power = value;
        next.t = s.t + 0.2;
        next.label = `power(${value})`;
        next.note = `The launcher is set to ${value}% power.`;
        break;
      }
      case "score": {
        const inGoal = s.x === GOAL_TILE.x && s.y === GOAL_TILE.y;
        next.label = "score()";
        next.t = s.t + TIME_COST.score;
        next.claw = "open";
        if (inGoal && s.holding) {
          next.holding = false;
          next.score = s.score + 12;
          next.note =
            "Sample released inside the goal zone: +12 points. Autonomous points count double at most events because nobody is driving.";
        } else {
          next.holding = s.holding;
          next.note = inGoal
            ? "The robot is in the goal zone but isn't holding anything, so nothing scores."
            : "Nothing scores here — the robot has to be standing in the teal goal zone when it releases.";
        }
        break;
      }
      case "wait": {
        const sec = Number(arg);
        if (!Number.isFinite(sec)) {
          errors.push({ line, message: "wait() needs seconds, like wait(1)." });
          return;
        }
        next.t = s.t + Math.max(0, sec);
        next.label = `wait(${sec})`;
        next.note = `The robot pauses ${sec}s. Real teams add short waits to let the arm finish moving before driving away.`;
        break;
      }
      default:
        errors.push({
          line,
          message: `"${name}" isn't a command. Try drive, turn, arm, claw, score or wait.`,
        });
        return;
    }

    frames.push(next);
    s = next;
  });

  return { frames, errors };
}

export const COMMAND_HELP = [
  { code: "drive(2)", what: "Drive forward 2 tiles (negative goes backward)." },
  { code: "turn(90)", what: "Pivot right 90°. turn(-90) pivots left. turn(45) aims diagonally." },
  { code: "arm(up)", what: "Raise or lower the arm: arm(up) / arm(down)." },
  { code: "intake(in)", what: "Pull a pollen ball in; intake(out) ejects it." },
  { code: "aim(15)", what: "Turn the launcher 15° for a precise shot." },
  { code: "power(75)", what: "Set launcher power from 0 to 100%." },
  { code: "claw(close)", what: "Grab or drop: claw(close) / claw(open)." },
  { code: "score()", what: "Outtake the held ball into the goal zone." },
  { code: "wait(1)", what: "Pause for a second." },
];
