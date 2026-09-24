import type { Frame, Level } from "./sim";

export type Lesson = {
  id: string;
  title: string;
  concept: string;
  explain: string;
  task: string;
  hint: string;
  level: Level;
  starter: string;
  check: (last: Frame) => boolean;
};

export const LESSONS: Lesson[] = [
  {
    id: "drive",
    title: "1. Drive forward",
    concept: "Motors & encoders",
    explain:
      "drive(n) spins both sides of the drivetrain the same way. Encoders on the motors count wheel rotations so the robot stops after exactly n tiles.",
    task: "Drive the robot from the start box into the goal, 3 tiles straight ahead.",
    hint: "Try drive(3).",
    level: { start: { x: 2, y: 5 }, sample: null, goal: { x: 2, y: 2 } },
    starter: "// Drive into the goal\ndrive(1)\n",
    check: (f) => f.x === 2 && f.y === 2,
  },
  {
    id: "turn",
    title: "2. Turning",
    concept: "Gyro / IMU",
    explain:
      "turn(deg) spins the wheels in opposite directions so the robot pivots in place. Positive turns right, negative turns left. The IMU sensor measures the angle.",
    task: "The goal is up and to the right. Drive, turn, and drive again to park in it.",
    hint: "drive(2), turn(90), drive(3)",
    level: { start: { x: 1, y: 5 }, sample: null, goal: { x: 4, y: 3 } },
    starter: "drive(2)\n// now turn toward the goal\n",
    check: (f) => f.x === 4 && f.y === 3,
  },
  {
    id: "grab",
    title: "3. Grab a sample",
    concept: "Servos & claws",
    explain:
      "A servo moves to a set position and holds it — perfect for a claw. The arm must be down and the robot on the sample's tile for claw(close) to grab it.",
    task: "Drive to the yellow sample and pick it up, then lift the arm.",
    hint: "drive(2), claw(close), arm(up)",
    level: { start: { x: 3, y: 5 }, sample: { x: 3, y: 3 }, goal: null },
    starter: "// go get the sample\n",
    check: (f) => f.holding && f.arm === "up",
  },
  {
    id: "score",
    title: "4. Full autonomous",
    concept: "Sequencing",
    explain:
      "A real autonomous chains every skill together. Plan your path on the field first, then write one line per move.",
    task: "Grab the sample and score it in the goal for 12 points.",
    hint: "drive(2), turn(90), drive(1), claw(close), arm(up), turn(-90), drive(2), score()",
    level: { start: { x: 1, y: 5 }, sample: { x: 2, y: 3 }, goal: { x: 2, y: 1 } },
    starter: "// Your full autonomous here\n",
    check: (f) => f.score >= 12,
  },
  {
    id: "challenge",
    title: "5. Challenge: long route",
    concept: "Planning & backing up",
    explain:
      "drive() accepts negative numbers to reverse. Good teams save time by backing up instead of turning around.",
    task: "The sample is behind a corner. Grab it and score in the far goal.",
    hint: "Map it out: the sample is at column 5, the goal at column 1 near the top.",
    level: { start: { x: 0, y: 5 }, sample: { x: 4, y: 4 }, goal: { x: 0, y: 0 } },
    starter: "// Plan carefully!\n",
    check: (f) => f.score >= 12,
  },
];
