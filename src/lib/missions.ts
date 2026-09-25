import type { Frame, Level } from "./sim";

export type Mission = {
  id: string;
  title: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  task: string;
  level: Level;
  check: (last: Frame) => boolean;
};

const scored = (f: Frame) => f.score >= 12;
const parkAt = (x: number, y: number) => (f: Frame) => f.x === x && f.y === y;
const scoredAndPark = (x: number, y: number) => (f: Frame) => f.score >= 12 && f.x === x && f.y === y;

export const MISSIONS: Mission[] = [
  // ── Tier 1 (1-5): Basic linear movement and axial turning ──────────
  { id: "m1", title: "Straight shot", difficulty: 1, task: "Park in the goal straight ahead.",
    level: { start: { x: 3, y: 5 }, sample: null, goal: { x: 3, y: 1 } }, check: parkAt(3, 1) },
  { id: "m2", title: "Side step", difficulty: 1, task: "Park in the goal off to the left.",
    level: { start: { x: 4, y: 5 }, sample: null, goal: { x: 1, y: 3 } }, check: parkAt(1, 3) },
  { id: "m3", title: "Right angle", difficulty: 1, task: "Drive forward then turn right to reach the goal.",
    level: { start: { x: 1, y: 5 }, sample: null, goal: { x: 4, y: 4 } }, check: parkAt(4, 4) },
  { id: "m4", title: "U-turn", difficulty: 2, task: "Drive up, turn 180°, and park back where you started — but one tile over.",
    level: { start: { x: 2, y: 5 }, sample: null, goal: { x: 3, y: 5 } }, check: parkAt(3, 5) },
  { id: "m5", title: "Three-point turn", difficulty: 2, task: "Drive, back up, then drive to the goal on the far side.",
    level: { start: { x: 0, y: 5 }, sample: null, goal: { x: 5, y: 3 } }, check: parkAt(5, 3) },

  // ── Tier 2 (6-10): Mechanical manipulation — arm and claw ──────────
  { id: "m6", title: "Quick pickup", difficulty: 2, task: "Grab the sample right in front, then score it in the goal ahead.",
    level: { start: { x: 2, y: 5 }, sample: { x: 2, y: 4 }, goal: { x: 2, y: 1 } }, check: scored },
  { id: "m7", title: "Around the corner", difficulty: 2, task: "Grab the sample to the right and score it.",
    level: { start: { x: 0, y: 5 }, sample: { x: 3, y: 5 }, goal: { x: 3, y: 2 } }, check: scored },
  { id: "m8", title: "Lift and deliver", difficulty: 3, task: "Pick up the sample, raise the arm, drive across, and score.",
    level: { start: { x: 1, y: 5 }, sample: { x: 1, y: 3 }, goal: { x: 4, y: 3 } }, check: scored },
  { id: "m9", title: "Zig-zag", difficulty: 3, task: "Pick up the sample and bring it back to the far-left goal.",
    level: { start: { x: 1, y: 5 }, sample: { x: 4, y: 3 }, goal: { x: 0, y: 1 } }, check: scored },
  { id: "m10", title: "Reverse gear", difficulty: 3, task: "The goal is behind the sample. Try backing up with a negative drive.",
    level: { start: { x: 2, y: 5 }, sample: { x: 2, y: 1 }, goal: { x: 2, y: 4 } }, check: scored },

  // ── Tier 3 (11-15): Complex routing, obstacles, multi-step delivery ─
  { id: "m11", title: "Cross the field", difficulty: 3, task: "Travel from the blue side to the red side and back to score.",
    level: { start: { x: 0, y: 5 }, sample: { x: 5, y: 2 }, goal: { x: 1, y: 0 } }, check: scored },
  { id: "m12", title: "Tight corner", difficulty: 4, task: "Sample is in the top-right corner, goal in the bottom-left.",
    level: { start: { x: 3, y: 5 }, sample: { x: 5, y: 0 }, goal: { x: 0, y: 4 } }, check: scored },
  { id: "m13", title: "Long detour", difficulty: 4, task: "The sample is across the field. Plan a route that avoids the center.",
    level: { start: { x: 0, y: 5 }, sample: { x: 5, y: 5 }, goal: { x: 0, y: 0 } }, check: scored },
  { id: "m14", title: "Double pickup", difficulty: 4, task: "Grab the sample, score it, then park in the starting box.",
    level: { start: { x: 5, y: 5 }, sample: { x: 2, y: 3 }, goal: { x: 3, y: 0 } },
    check: scoredAndPark(5, 5) },
  { id: "m15", title: "Spiral route", difficulty: 4, task: "The sample is in the center. Grab it and deliver to the corner goal.",
    level: { start: { x: 0, y: 5 }, sample: { x: 3, y: 3 }, goal: { x: 5, y: 0 } }, check: scored },

  // ── Tier 4 (16-25): Advanced autonomous challenges ─────────────────
  { id: "m16", title: "Full lap", difficulty: 5, task: "Grab, score, then park back in your starting box.",
    level: { start: { x: 5, y: 5 }, sample: { x: 0, y: 3 }, goal: { x: 3, y: 0 } },
    check: scoredAndPark(5, 5) },
  { id: "m17", title: "Championship auto", difficulty: 5, task: "Score the sample and finish parked in the center (column 3, row 3) — in as few lines as you can.",
    level: { start: { x: 0, y: 5 }, sample: { x: 5, y: 4 }, goal: { x: 1, y: 0 } },
    check: (f) => f.score >= 12 && f.x === 2 && f.y === 2 },
  { id: "m18", title: "Diagonal dash", difficulty: 5, task: "Sample in the far corner. Score in the opposite corner. Tight turns only.",
    level: { start: { x: 0, y: 5 }, sample: { x: 5, y: 0 }, goal: { x: 0, y: 0 } }, check: scored },
  { id: "m19", title: "Center squeeze", difficulty: 5, task: "The sample is dead center. Extract it and deliver to the side goal.",
    level: { start: { x: 2, y: 5 }, sample: { x: 2, y: 2 }, goal: { x: 5, y: 2 } }, check: scored },
  { id: "m20", title: "Two corners", difficulty: 5, task: "Start in one corner, grab from the opposite, score in a third.",
    level: { start: { x: 0, y: 5 }, sample: { x: 5, y: 5 }, goal: { x: 5, y: 0 } }, check: scored },
  { id: "m21", title: "Slalom run", difficulty: 5, task: "Weave through the field: grab the sample at column 4, row 2, and score at column 1, row 5.",
    level: { start: { x: 3, y: 5 }, sample: { x: 4, y: 1 }, goal: { x: 1, y: 5 } }, check: scored },
  { id: "m22", title: "Precision park", difficulty: 5, task: "Score the sample and park exactly at column 0, row 0.",
    level: { start: { x: 5, y: 5 }, sample: { x: 3, y: 3 }, goal: { x: 2, y: 1 } },
    check: scoredAndPark(0, 0) },
  { id: "m23", title: "Grand tour", difficulty: 5, task: "Visit all four corners: start bottom-left, grab top-right sample, score bottom-right, park top-left.",
    level: { start: { x: 0, y: 5 }, sample: { x: 5, y: 0 }, goal: { x: 5, y: 5 } },
    check: scoredAndPark(0, 0) },
  { id: "m24", title: "Time trial", difficulty: 5, task: "Grab and score using the fewest lines possible. Sample at column 4, row 4. Goal at column 1, row 1.",
    level: { start: { x: 2, y: 5 }, sample: { x: 4, y: 4 }, goal: { x: 1, y: 1 } }, check: scored },
  { id: "m25", title: "Ultimate auto", difficulty: 5, task: "The hardest route: sample in the far corner, goal in the opposite, then park dead center.",
    level: { start: { x: 0, y: 5 }, sample: { x: 5, y: 0 }, goal: { x: 0, y: 0 } },
    check: (f) => f.score >= 12 && f.x === 2 && f.y === 2 },
];
