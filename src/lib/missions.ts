import type { Frame, Level } from "./sim";

export type Mission = {
  id: string;
  title: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tier: "Driving" | "Mechanisms" | "Path planning" | "Championship";
  task: string;
  level: Level;
  /** virtual seconds allowed (championship missions) */
  timeLimit?: number;
  /** a known working program, used as the hint */
  solution: string;
  check: (last: Frame) => boolean;
};

type Pt = { x: number; y: number };
const P = (x: number, y: number): Pt => ({ x, y });
const at = (x: number, y: number) => (f: Frame) => f.x === x && f.y === y;
const pts = (min: number) => (f: Frame) => f.score >= min;
const all =
  (...cs: ((f: Frame) => boolean)[]) =>
  (f: Frame) =>
    cs.every((c) => c(f));

type Def = Omit<Mission, "id" | "check"> & { check: (f: Frame) => boolean };

const DEFS: Def[] = [
  // ── 1–5 Driving ──
  { title: "Straight shot", difficulty: 1, tier: "Driving", task: "Park in the goal 3 tiles ahead.",
    level: { start: P(2, 5), sample: null, goal: P(2, 2) }, solution: "drive(3)", check: at(2, 2) },
  { title: "Right turn", difficulty: 1, tier: "Driving", task: "Turn right and park in the goal along the wall.",
    level: { start: P(1, 5), sample: null, goal: P(4, 5) }, solution: "turn(90)\ndrive(3)", check: at(4, 5) },
  { title: "Left side step", difficulty: 1, tier: "Driving", task: "Drive up, turn left, and park.",
    level: { start: P(3, 5), sample: null, goal: P(1, 3) }, solution: "drive(2)\nturn(-90)\ndrive(2)", check: at(1, 3) },
  { title: "Corner to corner", difficulty: 2, tier: "Driving", task: "Cross to the far top-right corner.",
    level: { start: P(0, 5), sample: null, goal: P(5, 0) }, solution: "drive(5)\nturn(90)\ndrive(5)", check: at(5, 0) },
  { title: "About face", difficulty: 2, tier: "Driving", task: "Park in the goal, then spin to face back toward your wall (180°).",
    level: { start: P(4, 5), sample: null, goal: P(4, 3) }, solution: "drive(2)\nturn(180)",
    check: (f) => at(4, 3)(f) && f.heading === 180 },
  // ── 6–10 Mechanisms ──
  { title: "First grab", difficulty: 2, tier: "Mechanisms", task: "Drive to the sample, close the claw, and lift the arm.",
    level: { start: P(2, 5), sample: P(2, 3), goal: null }, solution: "drive(2)\nclaw(close)\narm(up)",
    check: (f) => f.holding && f.arm === "up" },
  { title: "Off-axis pickup", difficulty: 2, tier: "Mechanisms", task: "The sample is up and to the right. Grab it and lift.",
    level: { start: P(1, 5), sample: P(3, 4), goal: null }, solution: "drive(1)\nturn(90)\ndrive(2)\nclaw(close)\narm(up)",
    check: (f) => f.holding && f.arm === "up" },
  { title: "First score", difficulty: 3, tier: "Mechanisms", task: "Grab the sample right ahead and score it in the goal.",
    level: { start: P(2, 5), sample: P(2, 4), goal: P(2, 1) }, solution: "drive(1)\nclaw(close)\narm(up)\ndrive(3)\nscore()", check: pts(12) },
  { title: "Carry across", difficulty: 3, tier: "Mechanisms", task: "Grab the sample, then carry it right to the goal.",
    level: { start: P(0, 5), sample: P(0, 2), goal: P(3, 2) }, solution: "drive(3)\nclaw(close)\narm(up)\nturn(90)\ndrive(3)\nscore()", check: pts(12) },
  { title: "Stow it", difficulty: 3, tier: "Mechanisms", task: "Score the sample, then lower the arm back down to finish safely.",
    level: { start: P(3, 5), sample: P(3, 3), goal: P(1, 1) },
    solution: "drive(2)\nclaw(close)\narm(up)\ndrive(2)\nturn(-90)\ndrive(2)\nscore()\narm(down)",
    check: (f) => f.score >= 12 && f.arm === "down" },
  // ── 11–15 Path planning (red tiles are forbidden) ──
  { title: "Detour", difficulty: 3, tier: "Path planning", task: "A red obstacle blocks the lane. Drive around it into the goal.",
    level: { start: P(2, 5), sample: null, goal: P(2, 1), obstacles: [P(2, 3)] },
    solution: "drive(1)\nturn(90)\ndrive(1)\nturn(-90)\ndrive(3)\nturn(-90)\ndrive(1)", check: at(2, 1) },
  { title: "Blocked wall", difficulty: 3, tier: "Path planning", task: "The wall row is blocked. Go up, over, and back down to the goal.",
    level: { start: P(0, 5), sample: null, goal: P(5, 5), obstacles: [P(1, 5), P(2, 5), P(3, 5), P(4, 5)] },
    solution: "drive(1)\nturn(90)\ndrive(5)\nturn(90)\ndrive(1)", check: at(5, 5) },
  { title: "Guarded sample", difficulty: 4, tier: "Path planning", task: "Obstacles guard the sample and goal. Find a safe route to score.",
    level: { start: P(3, 5), sample: P(3, 2), goal: P(0, 0), obstacles: [P(3, 4), P(1, 1), P(2, 0)] },
    solution: "turn(-90)\ndrive(1)\nturn(90)\ndrive(3)\nturn(90)\ndrive(1)\nclaw(close)\narm(up)\nturn(-90)\ndrive(2)\nturn(-90)\ndrive(3)\nscore()",
    check: pts(12) },
  { title: "The long wall", difficulty: 4, tier: "Path planning", task: "A wall splits the field. Go around the top to reach the goal.",
    level: { start: P(0, 5), sample: null, goal: P(4, 5), obstacles: [P(2, 1), P(2, 2), P(2, 3), P(2, 4), P(2, 5)] },
    solution: "drive(5)\nturn(90)\ndrive(4)\nturn(90)\ndrive(5)", check: at(4, 5) },
  { title: "Maze run", difficulty: 4, tier: "Path planning", task: "Weave through the maze, grab the sample, and score it.",
    level: { start: P(0, 5), sample: P(5, 5), goal: P(5, 0), obstacles: [P(1, 5), P(1, 4), P(3, 5), P(3, 4), P(3, 3), P(4, 1), P(5, 1)] },
    solution: "drive(3)\nturn(90)\ndrive(2)\nturn(-90)\ndrive(1)\nturn(90)\ndrive(2)\nturn(90)\ndrive(3)\nclaw(close)\narm(up)\ndrive(-3)\nturn(-90)\ndrive(1)\nturn(90)\ndrive(-2)\nturn(90)\ndrive(1)\nturn(-90)\ndrive(-1)\nscore()",
    check: pts(12) },
  // ── 16–25 Championship (timed) ──
  { title: "Speed run", difficulty: 4, tier: "Championship", task: "Score one sample before the clock runs out.",
    level: { start: P(0, 5), sample: P(0, 3), goal: P(0, 1) }, timeLimit: 6,
    solution: "drive(2)\nclaw(close)\narm(up)\ndrive(2)\nscore()", check: pts(12) },
  { title: "Double stack", difficulty: 4, tier: "Championship", task: "Score BOTH samples (24 pts). Tip: drive backwards to go get the second.",
    level: { start: P(2, 5), sample: P(2, 4), samples: [P(2, 2)], goal: P(2, 0) }, timeLimit: 16,
    solution: "drive(1)\nclaw(close)\narm(up)\ndrive(4)\nscore()\narm(down)\ndrive(-2)\nclaw(close)\narm(up)\ndrive(2)\nscore()",
    check: pts(24) },
  { title: "Diagonal dash", difficulty: 4, tier: "Championship", task: "Both straight lanes are blocked. Use turn(45) to drive diagonally and score.",
    level: { start: P(0, 5), sample: P(3, 2), goal: P(5, 0), obstacles: [P(0, 4), P(1, 5)] }, timeLimit: 10,
    solution: "turn(45)\ndrive(3)\nclaw(close)\narm(up)\ndrive(2)\nscore()", check: pts(12) },
  { title: "Split pickup", difficulty: 5, tier: "Championship", task: "Two samples on opposite sides. Score both around the obstacle.",
    level: { start: P(1, 5), sample: P(1, 4), samples: [P(4, 4)], goal: P(4, 1), obstacles: [P(2, 2)] }, timeLimit: 22,
    solution: "drive(1)\nclaw(close)\narm(up)\nturn(90)\ndrive(3)\nturn(-90)\ndrive(3)\nscore()\narm(down)\ndrive(-3)\nclaw(close)\narm(up)\ndrive(3)\nscore()",
    check: pts(24) },
  { title: "Score and park", difficulty: 5, tier: "Championship", task: "Score the sample, then park back in your starting tile.",
    level: { start: P(5, 5), sample: P(0, 3), goal: P(3, 0) }, timeLimit: 22,
    solution: "drive(2)\nturn(-90)\ndrive(5)\nclaw(close)\narm(up)\nturn(90)\ndrive(3)\nturn(90)\ndrive(3)\nscore()\nturn(90)\ndrive(5)\nturn(-90)\ndrive(2)",
    check: all(pts(12), at(5, 5)) },
  { title: "Center finish", difficulty: 5, tier: "Championship", task: "Score, then finish parked in the center tile (column 3, row 3 from the top).",
    level: { start: P(0, 5), sample: P(5, 4), goal: P(1, 0) }, timeLimit: 20,
    solution: "drive(1)\nturn(90)\ndrive(5)\nclaw(close)\narm(up)\nturn(-90)\ndrive(4)\nturn(-90)\ndrive(4)\nscore()\nturn(-90)\ndrive(2)\nturn(-90)\ndrive(1)",
    check: all(pts(12), at(2, 2)) },
  { title: "Obstacle double", difficulty: 5, tier: "Championship", task: "Deliver two samples while dodging the obstacles.",
    level: { start: P(0, 5), sample: P(0, 3), samples: [P(3, 3)], goal: P(3, 0), obstacles: [P(1, 4), P(2, 2), P(1, 1)] }, timeLimit: 24,
    solution: "drive(2)\nclaw(close)\narm(up)\nturn(90)\ndrive(3)\nturn(-90)\ndrive(3)\nscore()\narm(down)\ndrive(-3)\nclaw(close)\narm(up)\ndrive(3)\nscore()",
    check: pts(24) },
  { title: "Diagonal double", difficulty: 5, tier: "Championship", task: "Two samples on the diagonal. Score both fast.",
    level: { start: P(0, 5), sample: P(1, 4), samples: [P(3, 2)], goal: P(5, 0) }, timeLimit: 20,
    solution: "turn(45)\ndrive(1)\nclaw(close)\narm(up)\ndrive(4)\nscore()\narm(down)\ndrive(-2)\nclaw(close)\narm(up)\ndrive(2)\nscore()",
    check: pts(24) },
  { title: "Triple threat", difficulty: 5, tier: "Championship", task: "Score all THREE samples (36 pts).",
    level: { start: P(3, 5), sample: P(3, 4), samples: [P(3, 3), P(3, 2)], goal: P(3, 0) }, timeLimit: 22,
    solution: "drive(1)\nclaw(close)\narm(up)\ndrive(4)\nscore()\narm(down)\ndrive(-3)\nclaw(close)\narm(up)\ndrive(3)\nscore()\narm(down)\ndrive(-2)\nclaw(close)\narm(up)\ndrive(2)\nscore()",
    check: pts(36) },
  { title: "Championship auto", difficulty: 5, tier: "Championship", task: "Two samples, obstacles, and a tight clock. Score both and park in your start tile.",
    level: { start: P(5, 5), sample: P(5, 3), samples: [P(2, 3)], goal: P(2, 0), obstacles: [P(4, 1), P(3, 4), P(0, 2)] }, timeLimit: 32,
    solution: "drive(2)\nclaw(close)\narm(up)\nturn(-90)\ndrive(3)\nturn(90)\ndrive(3)\nscore()\narm(down)\ndrive(-3)\nclaw(close)\narm(up)\ndrive(3)\nscore()\ndrive(-3)\nturn(90)\ndrive(3)\nturn(90)\ndrive(2)",
    check: all(pts(24), at(5, 5)) },
];

export const MISSIONS: Mission[] = DEFS.map((d, i) => ({
  ...d,
  id: `m${i + 1}`,
  check: (f: Frame) => !f.crashed && (d.timeLimit == null || f.t <= d.timeLimit) && d.check(f),
}));
