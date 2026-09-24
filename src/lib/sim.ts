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
  score: number;
  label: string;
  note: string;
};

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
  score: 0,
  label: "Robot initialized",
  note: "Every autonomous program starts from a legal starting position touching the wall. Press Step to run one line at a time, or Run to watch the whole 30 seconds.",
};

function stripComment(raw: string) {
  const i = raw.indexOf("//");
  return (i === -1 ? raw : raw.slice(0, i)).trim();
}

function clamp(n: number) {
  return Math.max(0, Math.min(FIELD_TILES - 1, n));
}

export function runProgram(source: string): Program {
  const errors: ParseError[] = [];
  const frames: Frame[] = [baseFrame];
  let s: Frame = { ...baseFrame };

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
        const dx = Math.round(Math.sin(rad)) * tiles;
        const dy = -Math.round(Math.cos(rad)) * tiles;
        next.x = clamp(s.x + dx);
        next.y = clamp(s.y + dy);
        next.label = `drive(${tiles})`;
        next.note = `Both drive motors run the same direction, so the robot moves ${Math.abs(
          tiles,
        )} tile${Math.abs(tiles) === 1 ? "" : "s"} in a straight line. Encoders count the wheel turns and stop it there.`;
        break;
      }
      case "turn": {
        const deg = Number(arg);
        if (!Number.isFinite(deg)) {
          errors.push({ line, message: "turn() needs degrees, like turn(90) or turn(-90)." });
          return;
        }
        next.heading = ((s.heading + deg) % 360 + 360) % 360;
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
        if (dir === "close") {
          next.claw = "closed";
          const onSample =
            s.x === SAMPLE_TILE.x && s.y === SAMPLE_TILE.y && s.arm === "down";
          next.holding = onSample;
          next.label = "claw(close)";
          next.note = onSample
            ? "The claw servo squeezes shut on the sample. Servos hold a position instead of spinning, which is why they're used for grabbers."
            : "The claw closed on empty air — the robot has to be on the sample tile with the arm down first. Try driving to the yellow tile.";
        } else {
          next.claw = "open";
          next.holding = false;
          next.label = "claw(open)";
          next.note = "The claw opens and whatever it held drops onto the tile below.";
        }
        break;
      }
      case "score": {
        const inGoal = s.x === GOAL_TILE.x && s.y === GOAL_TILE.y;
        next.label = "score()";
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
  });

  return { frames, errors };
}

export const COMMAND_HELP = [
  { code: "drive(2)", what: "Drive forward 2 tiles (negative goes backward)." },
  { code: "turn(90)", what: "Pivot right 90°. turn(-90) pivots left." },
  { code: "arm(up)", what: "Raise or lower the arm: arm(up) / arm(down)." },
  { code: "claw(close)", what: "Grab or drop: claw(close) / claw(open)." },
  { code: "score()", what: "Release a held sample. Only scores inside the goal zone." },
  { code: "wait(1)", what: "Pause for a second." },
];
