import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Frame } from "@/lib/sim";

// ── Constants ──────────────────────────────────────────────
// Field is 6×6 tiles, each tile = 24" (0.6096 m). We use 1 tile = 2 units.
const TILE = 2;
const FIELD_SIZE = 6 * TILE; // 12 units

// Robot is 18" → 18/24 * 2 = 1.5 units per side
const ROBOT_HALF = 0.75;
const WHEEL_R = 0.16;
const WHEEL_W = 0.12;

// Arm angles: the arm is modeled pointing straight up (+y) at rotation 0.
// "up" = vertical; "down" = rotated forward until it lies flat toward the ground.
// Negative X rotation swings +y toward −z, i.e. OUT the front of the robot.
// (A positive angle swung the arm backwards through the chassis.)
const ARM_UP = 0;
const ARM_DOWN = -1.95; // ~112° forward — arm folds down past the front bumper, claw at tile level
const ARM_PIVOT_Z = -ROBOT_HALF - 0.08; // pivot sits just outside the front frame
const ARM_PIVOT_Y = 0.3;

// Convert grid (x,y) + heading to world position
// Grid (0,0) = top-left, y grows down. In 3D: x→worldX, y→worldZ (flipped so +y in grid = +z)
function gridToWorld(x: number, y: number): [number, number] {
  const wx = x * TILE + TILE / 2 - FIELD_SIZE / 2;
  const wz = y * TILE + TILE / 2 - FIELD_SIZE / 2;
  return [wx, -wz]; // flip z so heading 0 (up in grid) = -z in world
}

// ── Mecanum Wheel ───────────────────────────────────────────
function MecanumWheel({
  position,
  rotation,
  spinRef,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  spinRef: React.MutableRefObject<number>;
}) {
  const ref = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (ref.current) ref.current.rotation.x = spinRef.current;
  });

  const rollers = useMemo(() => {
    const arr: { angle: number; offset: number }[] = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      arr.push({ angle: (i / count) * Math.PI * 2, offset: 0 });
    }
    return arr;
  }, []);

  return (
    <group position={position} rotation={rotation}>
      <group ref={ref}>
        {/* Hub */}
        <mesh castShadow>
          <cylinderGeometry args={[WHEEL_R * 0.35, WHEEL_R * 0.35, WHEEL_W * 1.05, 12]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.3} />
        </mesh>
        {/* Tire / outer ring */}
        <mesh castShadow>
          <cylinderGeometry args={[WHEEL_R, WHEEL_R, WHEEL_W, 24]} />
          <meshStandardMaterial color="#0d0d0d" metalness={0.1} roughness={0.95} />
        </mesh>
        {/* Roller studs around the perimeter at 45° */}
        {rollers.map((r, i) => (
          <group key={i} rotation={[0, 0, r.angle]}>
            <mesh
              position={[WHEEL_R * 0.78, 0, 0]}
              rotation={[0, 0, Math.PI / 4]}
              castShadow
            >
              <capsuleGeometry args={[WHEEL_R * 0.18, WHEEL_W * 0.7, 4, 8]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? "#3a3a3a" : "#2a2a2a"}
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// ── Robot ───────────────────────────────────────────────────
export function Robot3D({ frame, instant }: { frame: Frame; instant?: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const armRef = useRef<THREE.Group>(null!);
  const clawL = useRef<THREE.Group>(null!);
  const clawR = useRef<THREE.Group>(null!);
  const intakeRef = useRef<THREE.Group>(null!);
  const launcherRef = useRef<THREE.Group>(null!);

  // Animation targets
  const targetPos = useRef(new THREE.Vector3());
  const targetRotY = useRef(0);
  const wheelSpin = useRef(0);
  const armTarget = useRef(ARM_DOWN); // radians: ARM_UP = vertical, ARM_DOWN = flat forward
  const clawTarget = useRef(0.04); // gap

  // Smoothed values
  const curPos = useRef(new THREE.Vector3());
  const curRotY = useRef(0);
  const curArm = useRef(ARM_DOWN);
  const curClaw = useRef(0.04);

  // Previous position for wheel spin calc
  const prevPos = useRef(new THREE.Vector3());

  useMemo(() => {
    const [wx, wz] = gridToWorld(frame.x, frame.y);
    targetPos.current.set(wx, 0, wz);
    // Heading: 0 = up (−z). In three.js, rotation around Y.
    // We rotate the group so that heading 0 faces −z. heading degrees clockwise in grid.
    // Convert: rotationY = −heading in radians (since +Y rotation is CCW when viewed from top)
    targetRotY.current = -(frame.heading * Math.PI) / 180;
    armTarget.current = frame.arm === "up" ? ARM_UP : ARM_DOWN;
    clawTarget.current = frame.claw === "closed" ? 0.01 : 0.06;
  }, [frame.x, frame.y, frame.heading, frame.arm, frame.claw]);

  const initialized = useRef(false);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    if (!initialized.current) {
      curPos.current.copy(targetPos.current);
      prevPos.current.copy(targetPos.current);
      curRotY.current = targetRotY.current;
      initialized.current = true;
    }
    const k = instant ? 1 - Math.exp(-25 * dt) : 1 - Math.exp(-5 * dt); // frame-rate independent smoothing

    // Position lerp
    curPos.current.lerp(targetPos.current, k);
    if (group.current) {
      group.current.position.copy(curPos.current);
    }

    // Rotation lerp (shortest path)
    let diff = targetRotY.current - curRotY.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    curRotY.current += diff * k;
    if (group.current) group.current.rotation.y = curRotY.current;

    // Wheel spin based on movement delta
    const delta = curPos.current.distanceTo(prevPos.current);
    if (delta > 0.0001) {
      wheelSpin.current += delta * 8;
    }
    // Also spin during rotation
    const rotDelta = Math.abs(diff) * dt * 6;
    if (rotDelta > 0.001) {
      wheelSpin.current += rotDelta * 3;
    }
    prevPos.current.copy(curPos.current);

    // Arm lerp
    curArm.current += (armTarget.current - curArm.current) * k;
    if (armRef.current) armRef.current.rotation.x = curArm.current;

    // Claw lerp
    curClaw.current += (clawTarget.current - curClaw.current) * k;
    if (clawL.current) clawL.current.position.x = -curClaw.current;
    if (clawR.current) clawR.current.position.x = curClaw.current;
    if (intakeRef.current && frame.intake !== "idle") intakeRef.current.rotation.x += dt * (frame.intake === "in" ? 14 : -14);
    if (launcherRef.current) launcherRef.current.rotation.y = (frame.aim * Math.PI) / 180;
  });

  // Wheel positions (relative to robot center)
  // Robot is 18" → 1.5 units. Wheels at corners slightly outside.
  const wx = ROBOT_HALF * 0.92;
  const wz = ROBOT_HALF * 0.82;
  const wy = WHEEL_R; // wheel center height

  return (
    <group ref={group}>
      {/* Shadow plane */}
      <mesh
        position={[0, 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[ROBOT_HALF * 2.2, ROBOT_HALF * 2.2]} />
        <meshBasicMaterial color="black" transparent opacity={0.25} />
      </mesh>

      {/* ── Chassis: open-channel aluminum frame ── */}
      {/* Side rails */}
      {[-1, 1].map((side) => (
        <mesh key={`rail-${side}`} position={[side * ROBOT_HALF * 0.85, 0.12, 0]} castShadow>
          <boxGeometry args={[0.06, 0.08, ROBOT_HALF * 1.8]} />
          <meshStandardMaterial color="#c8ccd0" metalness={0.85} roughness={0.35} />
        </mesh>
      ))}
      {/* Front and rear cross-members */}
      {[-1, 1].map((side) => (
        <mesh key={`cross-${side}`} position={[0, 0.12, side * ROBOT_HALF * 0.85]} castShadow>
          <boxGeometry args={[ROBOT_HALF * 1.7, 0.06, 0.06]} />
          <meshStandardMaterial color="#b8bcc0" metalness={0.85} roughness={0.35} />
        </mesh>
      ))}

      {/* ── Layered chassis deck and protective bumpers ── */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[ROBOT_HALF * 1.62, 0.08, ROBOT_HALF * 1.62]} />
        <meshStandardMaterial color="#8f969c" metalness={0.82} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.22, 0.02]} castShadow>
        <boxGeometry args={[ROBOT_HALF * 1.38, 0.045, ROBOT_HALF * 1.35]} />
        <meshStandardMaterial color="#202a36" metalness={0.45} roughness={0.52} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`bumper-${side}`} position={[side * ROBOT_HALF * 0.93, 0.28, 0]} castShadow>
          <boxGeometry args={[0.1, 0.2, ROBOT_HALF * 1.55]} />
          <meshStandardMaterial color="#253c69" metalness={0.25} roughness={0.72} />
        </mesh>
      ))}
      <mesh position={[0, 0.28, ROBOT_HALF * 0.93]} castShadow>
        <boxGeometry args={[ROBOT_HALF * 1.55, 0.2, 0.1]} />
        <meshStandardMaterial color="#253c69" metalness={0.25} roughness={0.72} />
      </mesh>
      {/* ── Control hub + battery, with realistic mounting straps ── */}
      <mesh position={[0, 0.34, 0.15]} castShadow>
        <boxGeometry args={[0.42, 0.16, 0.24]} />
        <meshStandardMaterial color="#2a3342" metalness={0.55} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.34, -0.22]} castShadow>
        <boxGeometry args={[0.34, 0.14, 0.22]} />
        <meshStandardMaterial color="#171b20" metalness={0.35} roughness={0.74} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`strap-${side}`} position={[side * 0.12, 0.43, -0.22]} castShadow>
          <boxGeometry args={[0.035, 0.02, 0.24]} />
          <meshStandardMaterial color="#d8a927" metalness={0.6} roughness={0.36} />
        </mesh>
      ))}
      {/* Cooling fins, status light, and wiring detail */}
      {[-0.12, -0.04, 0.04, 0.12].map((x) => (
        <mesh key={`fin-${x}`} position={[x, 0.44, 0.15]} castShadow>
          <boxGeometry args={[0.025, 0.035, 0.18]} />
          <meshStandardMaterial color="#59636d" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[-0.14, 0.46, 0.15]}>
        <sphereGeometry args={[0.018, 10, 8]} />
        <meshStandardMaterial color="#53e0ad" emissive="#2ccf98" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0.2, 0.29, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.12, 0.012, 8, 18, Math.PI]} />
        <meshStandardMaterial color="#111820" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* ── Team number plate ── */}
      <mesh position={[0, 0.06, -ROBOT_HALF * 0.95]} castShadow>
        <boxGeometry args={[0.5, 0.02, 0.08]} />
        <meshStandardMaterial color="#3b6fde" metalness={0.65} roughness={0.32} />
      </mesh>

      {/* ── Mecanum Wheels ── */}
      <MecanumWheel position={[-wx, wy, -wz]} rotation={[0, 0, Math.PI / 2]} spinRef={wheelSpin} />
      <MecanumWheel position={[wx, wy, -wz]} rotation={[0, 0, Math.PI / 2]} spinRef={wheelSpin} />
      <MecanumWheel position={[-wx, wy, wz]} rotation={[0, 0, Math.PI / 2]} spinRef={wheelSpin} />
      <MecanumWheel position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]} spinRef={wheelSpin} />

      {/* ── Lifting Arm + Claw ── */}
      {/* Arm pivot at front of robot */}
      <group position={[0, ARM_PIVOT_Y, ARM_PIVOT_Z]}>
        {/* Arm channel (rotates on X axis) */}
        <group ref={armRef}>
          {/* Arm extrusion */}
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.08, 0.5, 0.06]} />
            <meshStandardMaterial color="#f5b800" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Arm side supports */}
          {[-1, 1].map((s) => (
            <mesh key={`sup-${s}`} position={[s * 0.06, 0.25, 0]} castShadow>
              <boxGeometry args={[0.02, 0.5, 0.08]} />
              <meshStandardMaterial color="#d4a300" metalness={0.7} roughness={0.35} />
            </mesh>
          ))}

          {/* Claw assembly at top of arm */}
          <group position={[0, 0.5, 0]}>
            {/* Claw base */}
            <mesh castShadow>
              <boxGeometry args={[0.22, 0.04, 0.08]} />
              <meshStandardMaterial color="#3b6fde" metalness={0.5} roughness={0.45} />
            </mesh>

            {/* Left claw plate */}
            <group ref={clawL}>
              <mesh position={[0, 0.05, 0]} castShadow>
                <boxGeometry args={[0.03, 0.1, 0.08]} />
                <meshStandardMaterial color="#5588ff" metalness={0.5} roughness={0.4} />
              </mesh>
              <mesh position={[0.02, 0.1, 0]} castShadow>
                <boxGeometry args={[0.05, 0.02, 0.07]} />
                <meshStandardMaterial color="#5588ff" metalness={0.5} roughness={0.4} />
              </mesh>
            </group>

            {/* Right claw plate */}
            <group ref={clawR}>
              <mesh position={[0, 0.05, 0]} castShadow>
                <boxGeometry args={[0.03, 0.1, 0.08]} />
                <meshStandardMaterial color="#5588ff" metalness={0.5} roughness={0.4} />
              </mesh>
              <mesh position={[-0.02, 0.1, 0]} castShadow>
                <boxGeometry args={[0.05, 0.02, 0.07]} />
                <meshStandardMaterial color="#5588ff" metalness={0.5} roughness={0.4} />
              </mesh>
            </group>

            {/* Held sample */}
            {frame.holding && (
              <mesh position={[0, 0.08, 0]} castShadow>
                <boxGeometry args={[0.08, 0.14, 0.08]} />
                <meshStandardMaterial
                  color="#f5d020"
                  emissive="#cc9900"
                  emissiveIntensity={0.15}
                  metalness={0.3}
                  roughness={0.5}
                />
              </mesh>
            )}
          </group>
        </group>
      </group>

      {/* ── Ball intake: guide rails, compliant rollers, and side plates ── */}
      <group position={[0, 0.28, -ROBOT_HALF - 0.12]} ref={intakeRef}>
        {[-1, 1].map((side) => <mesh key={side} position={[side * 0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.105, 0.105, 0.34, 18]} />
          <meshStandardMaterial color="#e5a925" metalness={0.58} roughness={0.3} emissive={frame.intake === "in" ? "#6b4a00" : "#000000"} emissiveIntensity={0.55} />
        </mesh>)}
        {[-1, 1].map((side) => <mesh key={`guide-${side}`} position={[side * 0.3, 0.09, 0.02]} rotation={[0, 0, side * 0.28]} castShadow>
          <boxGeometry args={[0.045, 0.24, 0.06]} />
          <meshStandardMaterial color="#d4d9de" metalness={0.8} roughness={0.3} />
        </mesh>)}
        <mesh position={[0, -0.05, 0.02]} castShadow>
          <boxGeometry args={[0.62, 0.06, 0.12]} />
          <meshStandardMaterial color="#202a36" metalness={0.5} roughness={0.42} />
        </mesh>
      </group>
      {/* ── Adjustable flywheel outtake with hood and aiming ring ── */}
      <group position={[0, 0.55, -0.18]} ref={launcherRef}>
        <mesh castShadow><boxGeometry args={[0.46, 0.14, 0.34]} /><meshStandardMaterial color="#28354a" metalness={0.6} roughness={0.32} /></mesh>
        <mesh position={[0, 0.1, -0.18]} castShadow><cylinderGeometry args={[0.145, 0.145, 0.24, 20]} /><meshStandardMaterial color="#e5a925" metalness={0.72} roughness={0.27} emissive="#5d4200" emissiveIntensity={frame.power / 260} /></mesh>
        <mesh position={[0, 0.1, -0.31]}><torusGeometry args={[0.105, 0.026, 10, 20]} /><meshStandardMaterial color="#e9edf0" metalness={0.86} roughness={0.22} /></mesh>
        <mesh position={[0, 0.17, -0.13]} rotation={[0.18, 0, 0]} castShadow>
          <boxGeometry args={[0.4, 0.05, 0.22]} />
          <meshStandardMaterial color="#59636d" metalness={0.72} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.04, -0.33]}>
          <sphereGeometry args={[0.055, 16, 12]} />
          <meshStandardMaterial color="#f2c230" emissive="#8a5e00" emissiveIntensity={frame.intake === "out" ? 0.7 : 0.12} />
        </mesh>
      </group>

      {/* ── Heading indicator arrow ── */}
      <mesh
        position={[0, 0.02, -ROBOT_HALF - 0.05]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <coneGeometry args={[0.06, 0.12, 4]} />
        <meshStandardMaterial color="#f5d020" emissive="#cc9900" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}
