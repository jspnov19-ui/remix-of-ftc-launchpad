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

export const MISSIONS: Mission[] = [
  { id: "m1", title: "Straight shot", difficulty: 1, task: "Park in the goal straight ahead.",
    level: { start: { x: 3, y: 5 }, sample: null, goal: { x: 3, y: 1 } }, check: parkAt(3, 1) },
  { id: "m2", title: "Side step", difficulty: 1, task: "Park in the goal off to the left.",
    level: { start: { x: 4, y: 5 }, sample: null, goal: { x: 1, y: 3 } }, check: parkAt(1, 3) },
  { id: "m3", title: "Quick pickup", difficulty: 2, task: "Grab the sample right in front, then score it in the goal ahead.",
    level: { start: { x: 2, y: 5 }, sample: { x: 2, y: 4 }, goal: { x: 2, y: 1 } }, check: scored },
  { id: "m4", title: "Around the corner", difficulty: 2, task: "Grab the sample to the right and score it.",
    level: { start: { x: 0, y: 5 }, sample: { x: 3, y: 5 }, goal: { x: 3, y: 2 } }, check: scored },
  { id: "m5", title: "Zig-zag", difficulty: 3, task: "Pick up the sample and bring it back to the far-left goal.",
    level: { start: { x: 1, y: 5 }, sample: { x: 4, y: 3 }, goal: { x: 0, y: 1 } }, check: scored },
  { id: "m6", title: "Reverse gear", difficulty: 3, task: "The goal is behind the sample. Try backing up with a negative drive.",
    level: { start: { x: 2, y: 5 }, sample: { x: 2, y: 1 }, goal: { x: 2, y: 4 } }, check: scored },
  { id: "m7", title: "Cross the field", difficulty: 4, task: "Travel from the blue side to the red side and back to score.",
    level: { start: { x: 0, y: 5 }, sample: { x: 5, y: 2 }, goal: { x: 1, y: 0 } }, check: scored },
  { id: "m8", title: "Tight corner", difficulty: 4, task: "Sample is in the top-right corner, goal in the bottom-left.",
    level: { start: { x: 3, y: 5 }, sample: { x: 5, y: 0 }, goal: { x: 0, y: 4 } }, check: scored },
  { id: "m9", title: "Full lap", difficulty: 5, task: "Grab, score, then park back in your starting box.",
    level: { start: { x: 5, y: 5 }, sample: { x: 0, y: 3 }, goal: { x: 3, y: 0 } },
    check: (f) => f.score >= 12 && f.x === 5 && f.y === 5 },
  { id: "m10", title: "Championship auto", difficulty: 5, task: "Score the sample and finish parked in the center (column 3, row 3) — in as few lines as you can.",
    level: { start: { x: 0, y: 5 }, sample: { x: 5, y: 4 }, goal: { x: 1, y: 0 } },
    check: (f) => f.score >= 12 && f.x === 2 && f.y === 2 },
];
