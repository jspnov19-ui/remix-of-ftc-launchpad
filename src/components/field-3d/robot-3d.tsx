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
export function Robot3D({ frame }: { frame: Frame }) {
  const group = useRef<THREE.Group>(null!);
  const armRef = useRef<THREE.Group>(null!);
  const clawL = useRef<THREE.Group>(null!);
  const clawR = useRef<THREE.Group>(null!);

  // Animation targets
  const targetPos = useRef(new THREE.Vector3());
  const targetRotY = useRef(0);
  const wheelSpin = useRef(0);
  const armTarget = useRef(0); // radians, 0 = down, -1.1 = up
  const clawTarget = useRef(0.04); // gap

  // Smoothed values
  const curPos = useRef(new THREE.Vector3());
  const curRotY = useRef(0);
  const curArm = useRef(0);
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
    armTarget.current = frame.arm === "up" ? -1.15 : 0;
    clawTarget.current = frame.claw === "closed" ? 0.01 : 0.06;
  }, [frame.x, frame.y, frame.heading, frame.arm, frame.claw]);

  useFrame((_, dt) => {
    const k = Math.min(1, dt * 6); // smoothing factor

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

      {/* ── Control Hub + Battery ── */}
      <mesh position={[0, 0.18, 0.15]} castShadow>
        <boxGeometry args={[0.4, 0.12, 0.22]} />
        <meshStandardMaterial color="#2a2a3a" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.18, -0.2]} castShadow>
        <boxGeometry args={[0.3, 0.1, 0.18]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.2} roughness={0.8} />
      </mesh>
      {/* LED indicator */}
      <mesh position={[-0.1, 0.25, 0.15]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.8} />
      </mesh>

      {/* ── Team number plate ── */}
      <mesh position={[0, 0.06, -ROBOT_HALF * 0.95]} castShadow>
        <boxGeometry args={[0.5, 0.02, 0.08]} />
        <meshStandardMaterial color="#3b6fde" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* ── Mecanum Wheels ── */}
      <MecanumWheel position={[-wx, wy, -wz]} rotation={[0, 0, Math.PI / 2]} spinRef={wheelSpin} />
      <MecanumWheel position={[wx, wy, -wz]} rotation={[0, 0, Math.PI / 2]} spinRef={wheelSpin} />
      <MecanumWheel position={[-wx, wy, wz]} rotation={[0, 0, Math.PI / 2]} spinRef={wheelSpin} />
      <MecanumWheel position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]} spinRef={wheelSpin} />

      {/* ── Lifting Arm + Claw ── */}
      {/* Arm pivot at front of robot */}
      <group position={[0, 0.16, -ROBOT_HALF * 0.9]}>
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
