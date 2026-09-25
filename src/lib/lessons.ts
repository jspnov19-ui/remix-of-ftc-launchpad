import type { Frame, Level } from "./sim";

export type GuidedStep =
  | { kind: "talk"; title: string; body: string }
  | { kind: "checkpoint"; title: string; body: string; prompt: string; expect: string; hint: string };

export type GuidedStep =
  | { kind: "talk"; title: string; body: string }
  | { kind: "checkpoint"; title: string; body: string; prompt: string; expect: string; hint: string };

export type Lesson = {
  id: string;
  title: string;
  concept: string;
  explain: string;
  task: string;
  guided: GuidedStep[];
  hint: string;
  level: Level;
  starter: string;
  check: (last: Frame) => boolean;
  guided: GuidedStep[];
};

export const LESSONS: Lesson[] = [
  {
    id: "drive",
    title: "1. Drive forward",
    concept: "Motors & encoders",
    explain:
      "drive(n) spins both sides of the drivetrain the same way. Encoders on the motors count wheel rotations so the robot stops after exactly n tiles.",
    guided: [
      { kind: "talk", title: "Welcome to the simulator!", body: "In FTC, the first 30 seconds of a match are autonomous — the robot runs only the code you write, no driver. Let's learn how to make it move." },
      { kind: "talk", title: "The drive() command", body: "drive(n) tells both drive motors to spin the same direction. The number n is how many tiles to travel. Positive goes forward, negative goes backward." },
      { kind: "talk", title: "Encoders", body: "Each motor has an encoder — a sensor that counts wheel rotations. The robot drives until the encoders say it traveled exactly n tiles, then stops. No guessing." },
      { kind: "checkpoint", title: "Your turn: drive to the goal", body: "The goal is 3 tiles straight ahead. Write drive(3) in the code box to move the robot there.", prompt: "Write drive(3) below to drive forward 3 tiles.", expect: "drive(3)", hint: "Type exactly: drive(3)" },
      { kind: "talk", title: "You did it!", body: "The robot drove straight into the goal zone. That's your first autonomous move. In a real match, encoders aren't perfect — the robot might drift — but the concept is exactly this." },
    ],
    task: "Drive the robot from the start box into the goal, 3 tiles straight ahead.",
    hint: "Try drive(3).",
    level: { start: { x: 2, y: 5 }, sample: null, goal: { x: 2, y: 2 } },
    starter: "// Drive into the goal\ndrive(1)\n",
    check: (f) => f.x === 2 && f.y === 2,
    guided: [
      { kind: "talk", title: "Welcome to the simulator!", body: "In FTC, the first 30 seconds of a match are autonomous — the robot runs only the code you write, no driver. Let's learn how to make it move." },
      { kind: "talk", title: "The drive() command", body: "drive(n) tells both drive motors to spin the same direction. The number n is how many tiles to travel. Positive goes forward, negative goes backward." },
      { kind: "talk", title: "Encoders", body: "Each motor has an encoder — a sensor that counts wheel rotations. The robot drives until the encoders say it traveled exactly n tiles, then stops. No guessing." },
      { kind: "checkpoint", title: "Your turn: drive to the goal", body: "The goal is 3 tiles straight ahead. Write drive(3) in the code box to move the robot there.", prompt: "Write drive(3) below to drive forward 3 tiles.", expect: "drive(3)", hint: "Type exactly: drive(3)" },
      { kind: "talk", title: "You did it!", body: "The robot drove straight into the goal zone. That's your first autonomous move. In a real match, encoders aren't perfect — the robot might drift — but the concept is exactly this." },
    ],
    guided: [
      { kind: "talk", title: "Turning in place", body: "turn(deg) spins the left and right wheels in opposite directions. The robot pivots without moving forward or backward. Positive degrees turn right, negative turns left." },
      { kind: "talk", title: "The IMU sensor", body: "An Inertial Measurement Unit (IMU) tracks the robot's heading angle. The robot turns until the IMU reads the target angle, then stops — just like a compass." },
      { kind: "checkpoint", title: "Practice: turn right", body: "Write turn(90) to pivot the robot 90 degrees to the right.", prompt: "Write turn(90) to turn right.", expect: "turn(90)", hint: "Type exactly: turn(90)" },
      { kind: "talk", title: "Combining moves", body: "Real autonomous programs chain commands: drive, turn, drive again. Each line runs in order. The robot finishes one move before starting the next." },
      { kind: "checkpoint", title: "Reach the goal", body: "The goal is up and to the right. Write: drive(2) then turn(90) then drive(3) — one per line.", prompt: "Write all three lines: drive(2), turn(90), drive(3)", expect: "drive(2)\nturn(90)\ndrive(3)", hint: "Each command on its own line: drive(2)\\nturn(90)\\ndrive(3)" },
    ],
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
    guided: [
      { kind: "talk", title: "Servos vs motors", body: "Drive motors spin continuously. Servos move to a specific angle and hold there. A claw uses a servo because it needs to squeeze and hold — not spin." },
      { kind: "talk", title: "The arm", body: "arm(up) raises the arm so the claw lifts off the ground. arm(down) lowers it so the claw can reach a sample sitting on a tile. You need the arm down to grab." },
      { kind: "talk", title: "The claw", body: "claw(close) squeezes the claw shut. If the robot is on the same tile as a sample and the arm is down, it grabs the sample. claw(open) releases it." },
      { kind: "checkpoint", title: "Grab the sample", body: "The sample is 2 tiles ahead. Write drive(2), then claw(close), then arm(up) — one per line.", prompt: "Write: drive(2), claw(close), arm(up)", expect: "drive(2)\nclaw(close)\narm(up)", hint: "Three lines: drive(2)\\nclaw(close)\\narm(up)" },
    ],
    guided: [
      { kind: "talk", title: "Turning in place", body: "turn(deg) spins the left and right wheels in opposite directions. The robot pivots without moving forward or backward. Positive degrees turn right, negative turns left." },
      { kind: "talk", title: "The IMU sensor", body: "An Inertial Measurement Unit (IMU) tracks the robot's heading angle. The robot turns until the IMU reads the target angle, then stops — just like a compass." },
      { kind: "checkpoint", title: "Practice: turn right", body: "Write turn(90) to pivot the robot 90 degrees to the right.", prompt: "Write turn(90) to turn right.", expect: "turn(90)", hint: "Type exactly: turn(90)" },
      { kind: "talk", title: "Combining moves", body: "Real autonomous programs chain commands: drive, turn, drive again. Each line runs in order. The robot finishes one move before starting the next." },
      { kind: "checkpoint", title: "Reach the goal", body: "The goal is up and to the right. Write: drive(2) then turn(90) then drive(3) — one per line.", prompt: "Write all three lines: drive(2), turn(90), drive(3)", expect: "drive(2)\nturn(90)\ndrive(3)", hint: "Each command on its own line: drive(2)\\nturn(90)\\ndrive(3)" },
    ],
  },
  {
    id: "grab",
    title: "3. Grab a sample",
    concept: "Servos & claws",
    guided: [
      { kind: "talk", title: "Putting it all together", body: "A full autonomous routine chains driving, turning, grabbing, and scoring into one sequence. Each line is one action. The robot does them in order." },
      { kind: "talk", title: "Planning your path", body: "Before coding, trace the route on the field: where's the sample? Where's the goal? How many turns? Then write one command per step." },
      { kind: "talk", title: "The score() command", body: "score() opens the claw and releases whatever it's holding. If the robot is standing in the goal zone, you get 12 points. Autonomous points count double at most events." },
      { kind: "checkpoint", title: "Write the full auto", body: "Grab the sample and score it. You'll need: drive, turn, drive, claw(close), arm(up), turn back, drive, score().", prompt: "Write the full autonomous to grab and score the sample.", expect: "drive(2)\nturn(90)\ndrive(1)\nclaw(close)\narm(up)\nturn(-90)\ndrive(2)\nscore()", hint: "drive(2)\\nturn(90)\\ndrive(1)\\nclaw(close)\\narm(up)\\nturn(-90)\\ndrive(2)\\nscore()" },
    ],
    explain:
      "A servo moves to a set position and holds it — perfect for a claw. The arm must be down and the robot on the sample's tile for claw(close) to grab it.",
    task: "Drive to the yellow sample and pick it up, then lift the arm.",
    hint: "drive(2), claw(close), arm(up)",
    level: { start: { x: 3, y: 5 }, sample: { x: 3, y: 3 }, goal: null },
    starter: "// go get the sample\n",
    check: (f) => f.holding && f.arm === "up",
    guided: [
      { kind: "talk", title: "Servos vs motors", body: "Drive motors spin continuously. Servos move to a specific angle and hold there. A claw uses a servo because it needs to squeeze and hold — not spin." },
      { kind: "talk", title: "The arm", body: "arm(up) raises the arm so the claw lifts off the ground. arm(down) lowers it so the claw can reach a sample sitting on a tile. You need the arm down to grab." },
      { kind: "talk", title: "The claw", body: "claw(close) squeezes the claw shut. If the robot is on the same tile as a sample and the arm is down, it grabs the sample. claw(open) releases it." },
      { kind: "checkpoint", title: "Grab the sample", body: "The sample is 2 tiles ahead. Write drive(2), then claw(close), then arm(up) — one per line.", prompt: "Write: drive(2), claw(close), arm(up)", expect: "drive(2)\nclaw(close)\narm(up)", hint: "Three lines: drive(2)\\nclaw(close)\\narm(up)" },
    guided: [
      { kind: "talk", title: "Negative drive", body: "drive(-2) makes the robot drive backward 2 tiles. Sometimes backing up is faster than turning 180° and driving forward." },
      { kind: "talk", title: "Path planning", body: "Look at the field. The sample is at column 5, row 4. The goal is at column 0, row 0. Plan the fewest turns to get from start to sample to goal." },
      { kind: "checkpoint", title: "Solve the challenge", body: "Drive to the sample, grab it, and deliver it to the far goal. Plan your route first!", prompt: "Write an autonomous to grab the sample and score it.", expect: "drive(4)\nturn(90)\ndrive(1)\nclaw(close)\narm(up)\nturn(-90)\ndrive(4)\nturn(-90)\ndrive(4)\nscore()", hint: "Think step by step: drive to the sample, grab, then navigate to the goal and score." },
    ],
    ],
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
    guided: [
      { kind: "talk", title: "Putting it all together", body: "A full autonomous routine chains driving, turning, grabbing, and scoring into one sequence. Each line is one action. The robot does them in order." },
      { kind: "talk", title: "Planning your path", body: "Before coding, trace the route on the field: where's the sample? Where's the goal? How many turns? Then write one command per step." },
      { kind: "talk", title: "The score() command", body: "score() opens the claw and releases whatever it's holding. If the robot is standing in the goal zone, you get 12 points. Autonomous points count double at most events." },
      { kind: "checkpoint", title: "Write the full auto", body: "Grab the sample and score it. You'll need: drive, turn, drive, claw(close), arm(up), turn back, drive, score().", prompt: "Write the full autonomous to grab and score the sample.", expect: "drive(2)\nturn(90)\ndrive(1)\nclaw(close)\narm(up)\nturn(-90)\ndrive(2)\nscore()", hint: "drive(2)\\nturn(90)\\ndrive(1)\\nclaw(close)\\narm(up)\\nturn(-90)\\ndrive(2)\\nscore()" },
    ],
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
    guided: [
      { kind: "talk", title: "Negative drive", body: "drive(-2) makes the robot drive backward 2 tiles. Sometimes backing up is faster than turning 180° and driving forward." },
      { kind: "talk", title: "Path planning", body: "Look at the field. The sample is at column 5, row 4. The goal is at column 0, row 0. Plan the fewest turns to get from start to sample to goal." },
      { kind: "checkpoint", title: "Solve the challenge", body: "Drive to the sample, grab it, and deliver it to the far goal. Plan your route first!", prompt: "Write an autonomous to grab the sample and score it.", expect: "drive(4)\nturn(90)\ndrive(1)\nclaw(close)\narm(up)\nturn(-90)\ndrive(4)\nturn(-90)\ndrive(4)\nscore()", hint: "Think step by step: drive to the sample, grab, then navigate to the goal and score." },
    ],
  },
];
