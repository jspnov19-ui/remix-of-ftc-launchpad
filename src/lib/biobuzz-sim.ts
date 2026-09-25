/**
 * BioBuzz simulation engine — a 12×12 tile field with flowers, pollen, and nectar bins.
 * Designed for real-time teleop control and autonomous scripting.
 */

export const BIOBUZZ_TILES = 12;

export type Pollen = {
  id: number;
  x: number;
  y: number;
  collected: boolean;
};

export type NectarBin = {
  id: number;
  x: number;
  y: number;
  capacity: number;
  filled: number;
};

export type Flower = {
  x: number;
  y: number;
  color: string;
  hasPollen: boolean;
};

export type BioBuzzRobot = {
  x: number;
  y: number;
  heading: number;
  arm: "up" | "down";
  claw: "open" | "closed";
  holding: boolean;
  pollenCount: number;
  score: number;
};

export type BioBuzzState = {
  robot: BioBuzzRobot;
  pollen: Pollen[];
  bins: NectarBin[];
  flowers: Flower[];
  time: number;
  message: string;
};

export const BIOBUZZ_START = { x: 0, y: 11 };

export const BIOBUZZ_FLOWERS: Flower[] = [
  { x: 2, y: 2, color: "#ff6b9d", hasPollen: true },
  { x: 5, y: 1, color: "#c084fc", hasPollen: true },
  { x: 8, y: 3, color: "#ff6b9d", hasPollen: true },
  { x: 10, y: 6, color: "#fbbf24", hasPollen: true },
  { x: 7, y: 8, color: "#c084fc", hasPollen: true },
  { x: 3, y: 9, color: "#fbbf24", hasPollen: true },
  { x: 9, y: 10, color: "#ff6b9d", hasPollen: true },
  { x: 1, y: 6, color: "#fbbf24", hasPollen: true },
];

export const BIOBUZZ_POLLEN: Pollen[] = [
  { id: 0, x: 2, y: 2, collected: false },
  { id: 1, x: 5, y: 1, collected: false },
  { id: 2, x: 8, y: 3, collected: false },
  { id: 3, x: 10, y: 6, collected: false },
  { id: 4, x: 7, y: 8, collected: false },
  { id: 5, x: 3, y: 9, collected: false },
  { id: 6, x: 9, y: 10, collected: false },
  { id: 7, x: 1, y: 6, collected: false },
];

export const BIOBUZZ_BINS: NectarBin[] = [
  { id: 0, x: 6, y: 6, capacity: 4, filled: 0 },
  { id: 1, x: 11, y: 0, capacity: 4, filled: 0 },
];

export function createBioBuzzState(): BioBuzzState {
  return {
    robot: {
      x: BIOBUZZ_START.x,
      y: BIOBUZZ_START.y,
      heading: 0,
      arm: "down",
      claw: "open",
      holding: false,
      pollenCount: 0,
      score: 0,
    },
    pollen: BIOBUZZ_POLLEN.map((p) => ({ ...p, collected: false })),
    bins: BIOBUZZ_BINS.map((b) => ({ ...b, filled: 0 })),
    flowers: BIOBUZZ_FLOWERS.map((f) => ({ ...f, hasPollen: true })),
    time: 0,
    message: "Ready! Use WASD to move, Arrow keys to turn, I/K for arm, O/P for claw.",
  };
}

function clamp(n: number) {
  return Math.max(0, Math.min(BIOBUZZ_TILES - 1, n));
}

export type BioBuzzAction =
  | "forward" | "back" | "left" | "right" | "turnLeft" | "turnRight"
  | "armUp" | "armDown" | "clawOpen" | "clawClose" | "deposit";

export function applyAction(state: BioBuzzState, action: BioBuzzAction): BioBuzzState {
  const r = { ...state.robot };
  const pollen = state.pollen.map((p) => ({ ...p }));
  const bins = state.bins.map((b) => ({ ...b }));
  const flowers = state.flowers.map((f) => ({ ...f }));
  let message = "";

  switch (action) {
    case "forward": {
      const rad = (r.heading * Math.PI) / 180;
      r.x = clamp(r.x + Math.round(Math.sin(rad)));
      r.y = clamp(r.y - Math.round(Math.cos(rad)));
      message = "Moved forward";
      break;
    }
    case "back": {
      const rad = (r.heading * Math.PI) / 180;
      r.x = clamp(r.x - Math.round(Math.sin(rad)));
      r.y = clamp(r.y + Math.round(Math.cos(rad)));
      message = "Moved backward";
      break;
    }
    case "left": {
      const rad = (r.heading * Math.PI) / 180;
      r.x = clamp(r.x - Math.round(Math.cos(rad)));
      r.y = clamp(r.y - Math.round(Math.sin(rad)));
      message = "Strafed left";
      break;
    }
    case "right": {
      const rad = (r.heading * Math.PI) / 180;
      r.x = clamp(r.x + Math.round(Math.cos(rad)));
      r.y = clamp(r.y + Math.round(Math.sin(rad)));
      message = "Strafed right";
      break;
    }
    case "turnLeft":
      r.heading = ((r.heading - 45) % 360 + 360) % 360;
      message = "Turned left 45°";
      break;
    case "turnRight":
      r.heading = ((r.heading + 45) % 360 + 360) % 360;
      message = "Turned right 45°";
      break;
    case "armUp":
      r.arm = "up";
      message = "Arm raised";
      break;
    case "armDown":
      r.arm = "down";
      message = "Arm lowered";
      break;
    case "clawOpen":
      r.claw = "open";
      r.holding = false;
      message = "Claw opened";
      break;
    case "clawClose": {
      r.claw = "closed";
      const p = pollen.find((p) => !p.collected && p.x === r.x && p.y === r.y);
      if (p && r.arm === "down") {
        p.collected = true;
        r.holding = true;
        r.pollenCount += 1;
        const f = flowers.find((f) => f.x === p.x && f.y === p.y);
        if (f) f.hasPollen = false;
        message = "Pollen collected!";
      } else {
        message = "Claw closed — no pollen here";
      }
      break;
    }
    case "deposit": {
      const bin = bins.find((b) => b.x === r.x && b.y === r.y);
      if (bin && bin.filled < bin.capacity && r.pollenCount > 0) {
        const deposit = Math.min(r.pollenCount, bin.capacity - bin.filled);
        bin.filled += deposit;
        r.pollenCount -= deposit;
        r.score += deposit * 10;
        r.holding = r.pollenCount > 0;
        message = `Deposited ${deposit} pollen! +${deposit * 10} points`;
      } else if (bin) {
        message = bin.filled >= bin.capacity ? "Bin is full!" : "No pollen to deposit";
      } else {
        message = "Not at a nectar bin";
      }
      break;
    }
  }

  return { ...state, robot: r, pollen, bins, flowers, time: state.time + 0.5, message };
}

// ── Autonomous script runner ──────────────────────────────────
export type BioBuzzParseError = { line: number; message: string };

export type BioBuzzProgram = {
  states: BioBuzzState[];
  errors: BioBuzzParseError[];
};

export function runBioBuzzProgram(source: string): BioBuzzProgram {
  const errors: BioBuzzParseError[] = [];
  let state = createBioBuzzState();
  const states: BioBuzzState[] = [{ ...state, message: "Program started" }];

  source.split("\n").forEach((raw, idx) => {
    const line = idx + 1;
    const text = raw.replace(/\/\/.*$/, "").trim();
    if (!text) return;

    const match = /^([a-zA-Z]+)\s*\(\s*([^)]*?)\s*\)\s*;?$/.exec(text);
    if (!match) {
      errors.push({ line, message: `Can't read "${text}".` });
      return;
    }

    const name = (match[1] ?? "").toLowerCase();
    const arg = (match[2] ?? "").toLowerCase().replace(/['"]/g, "");

    let action: BioBuzzAction | null = null;
    switch (name) {
      case "drive": {
        const n = Number(arg);
        if (!Number.isFinite(n) || n === 0) { errors.push({ line, message: "drive() needs a number." }); return; }
        const dir = n > 0 ? "forward" : "back";
        for (let s = 0; s < Math.abs(n); s++) state = applyAction(state, dir);
        break;
      }
      case "strafe": {
        const n = Number(arg);
        if (!Number.isFinite(n) || n === 0) { errors.push({ line, message: "strafe() needs a number." }); return; }
        const dir = n > 0 ? "right" : "left";
        for (let s = 0; s < Math.abs(n); s++) state = applyAction(state, dir);
        break;
      }
      case "turn": {
        const deg = Number(arg);
        if (!Number.isFinite(deg)) { errors.push({ line, message: "turn() needs degrees." }); return; }
        const dir = deg > 0 ? "turnRight" : "turnLeft";
        const steps = Math.abs(deg) / 45;
        for (let s = 0; s < steps; s++) state = applyAction(state, dir);
        break;
      }
      case "arm":
        action = arg === "up" ? "armUp" : arg === "down" ? "armDown" : null;
        if (!action) { errors.push({ line, message: "arm() takes up or down." }); return; }
        state = applyAction(state, action);
        break;
      case "claw":
        action = arg === "close" ? "clawClose" : arg === "open" ? "clawOpen" : null;
        if (!action) { errors.push({ line, message: "claw() takes open or close." }); return; }
        state = applyAction(state, action);
        break;
      case "deposit":
        state = applyAction(state, "deposit");
        break;
      case "wait":
        // no-op for now, just advances time
        state = { ...state, time: state.time + Number(arg || 1) };
        break;
      default:
        errors.push({ line, message: `"${name}" isn't a BioBuzz command.` });
        return;
    }
    states.push({ ...state });
  });

  return { states, errors };
}

export const BIOBUZZ_COMMANDS = [
  { code: "drive(2)", what: "Drive forward 2 tiles (negative = backward)." },
  { code: "strafe(1)", what: "Strafe right 1 tile (negative = left)." },
  { code: "turn(45)", what: "Turn right 45°. turn(-45) turns left." },
  { code: "arm(up)", what: "Raise or lower the arm: arm(up) / arm(down)." },
  { code: "claw(close)", what: "Grab pollen: claw(close) / claw(open)." },
  { code: "deposit()", what: "Deposit pollen at a nectar bin. +10 per pollen." },
  { code: "wait(1)", what: "Pause for a second." },
];
