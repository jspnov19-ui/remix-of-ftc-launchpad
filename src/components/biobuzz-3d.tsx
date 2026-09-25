import { useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import {
  BIOBUZZ_TILES,
  type BioBuzzState,
  type Flower,
  type Pollen,
  type NectarBin,
} from "@/lib/biobuzz-sim";

const TILE = 1;
const FIELD_SIZE = BIOBUZZ_TILES * TILE;

function gridToWorld(x: number, y: number): [number, number] {
  const wx = x * TILE + TILE / 2 - FIELD_SIZE / 2;
  const wz = y * TILE + TILE / 2 - FIELD_SIZE / 2;
  return [wx, -wz];
}

// ── Grass tiles with subtle variation ────────────────────────
function GrassTiles() {
  const tiles = useMemo(() => {
    const arr: { x: number; z: number; alt: boolean }[] = [];
    for (let y = 0; y < BIOBUZZ_TILES; y++) {
      for (let x = 0; x < BIOBUZZ_TILES; x++) {
        arr.push({
          x: x * TILE + TILE / 2 - FIELD_SIZE / 2,
          z: -(y * TILE + TILE / 2 - FIELD_SIZE / 2),
          alt: (x + y) % 2 === 1,
        });
      }
    }
    return arr;
  }, []);

  return (
    <group>
      {tiles.map((t, i) => (
        <mesh key={i} position={[t.x, 0, t.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[TILE, TILE]} />
          <meshStandardMaterial
            color={t.alt ? "#2d5a27" : "#285322"}
            roughness={0.95}
            metalness={0.02}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Perimeter border ─────────────────────────────────────────
function GardenBorder() {
  const h = 0.15;
  const w = 0.1;
  return (
    <group>
      <mesh position={[0, h / 2, -FIELD_SIZE / 2 - w / 2]} castShadow>
        <boxGeometry args={[FIELD_SIZE + w * 2, h, w]} />
        <meshStandardMaterial color="#5a7a3a" roughness={0.7} />
      </mesh>
      <mesh position={[0, h / 2, FIELD_SIZE / 2 + w / 2]} castShadow>
        <boxGeometry args={[FIELD_SIZE + w * 2, h, w]} />
        <meshStandardMaterial color="#5a7a3a" roughness={0.7} />
      </mesh>
      <mesh position={[-FIELD_SIZE / 2 - w / 2, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, FIELD_SIZE]} />
        <meshStandardMaterial color="#5a7a3a" roughness={0.7} />
      </mesh>
      <mesh position={[FIELD_SIZE / 2 + w / 2, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, FIELD_SIZE]} />
        <meshStandardMaterial color="#5a7a3a" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ── Flower ──────────────────────────────────────────────────
function Flower3D({ flower }: { flower: Flower }) {
  const [wx, wz] = gridToWorld(flower.x, flower.y);
  return (
    <group position={[wx, 0, wz]}>
      {/* Stem */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.02, 0.3, 6]} />
        <meshStandardMaterial color="#3a7a2a" roughness={0.8} />
      </mesh>
      {/* Petals */}
      <group position={[0, 0.32, 0]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.07, 0, Math.sin(angle) * 0.07]}
              rotation={[0, angle, 0]}
              castShadow
            >
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial
                color={flower.color}
                emissive={flower.color}
                emissiveIntensity={0.15}
                roughness={0.5}
              />
            </mesh>
          );
        })}
        {/* Center */}
        <mesh castShadow>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// ── Pollen node ─────────────────────────────────────────────
function Pollen3D({ pollen }: { pollen: Pollen }) {
  if (pollen.collected) return null;
  const [wx, wz] = gridToWorld(pollen.x, pollen.y);
  return (
    <group position={[wx, 0.12, wz]}>
      <mesh castShadow>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial
          color="#fde047"
          emissive="#facc15"
          emissiveIntensity={0.4}
          metalness={0.3}
          roughness={0.3}
        />
      </mesh>
      {/* Glow ring */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.16, 24]} />
        <meshBasicMaterial color="#fde047" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Nectar bin ──────────────────────────────────────────────
function NectarBin3D({ bin }: { bin: NectarBin }) {
  const [wx, wz] = gridToWorld(bin.x, bin.y);
  const fillRatio = bin.filled / bin.capacity;
  return (
    <group position={[wx, 0, wz]}>
      {/* Base */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.2, 16]} />
        <meshStandardMaterial color="#8b5cf6" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Walls */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16, 1, true]} />
        <meshStandardMaterial color="#a78bfa" metalness={0.2} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Fill level */}
      {fillRatio > 0 && (
        <mesh position={[0, 0.15 + fillRatio * 0.2, 0]}>
          <cylinderGeometry args={[0.26, 0.26, fillRatio * 0.2, 16]} />
          <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={0.3} />
        </mesh>
      )}
      {/* Label post */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.08, 0.2, 0.08]} />
        <meshStandardMaterial color="#7c3aed" />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// ── BioBuzz Robot ───────────────────────────────────────────
function BioBuzzRobot({ state }: { state: BioBuzzState }) {
  const group = useRef<THREE.Group>(null!);
  const armRef = useRef<THREE.Group>(null!);
  const clawL = useRef<THREE.Group>(null!);
  const clawR = useRef<THREE.Group>(null!);

  const targetPos = useRef(new THREE.Vector3());
  const targetRotY = useRef(0);
  const curPos = useRef(new THREE.Vector3());
  const curRotY = useRef(0);
  const curArm = useRef(0);
  const curClaw = useRef(0.04);
  const initialized = useRef(false);

  const ROBOT_HALF = 0.38;

  useMemo(() => {
    const [wx, wz] = gridToWorld(state.robot.x, state.robot.y);
    targetPos.current.set(wx, 0, wz);
    targetRotY.current = -(state.robot.heading * Math.PI) / 180;
  }, [state.robot.x, state.robot.y, state.robot.heading]);

  const armTarget = state.robot.arm === "up" ? 0 : -1.2;
  const clawTarget = state.robot.claw === "closed" ? 0.01 : 0.06;

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    if (!initialized.current) {
      curPos.current.copy(targetPos.current);
      curRotY.current = targetRotY.current;
      initialized.current = true;
    }
    const k = 1 - Math.exp(-8 * dt);

    curPos.current.lerp(targetPos.current, k);
    if (group.current) group.current.position.copy(curPos.current);

    let diff = targetRotY.current - curRotY.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    curRotY.current += diff * k;
    if (group.current) group.current.rotation.y = curRotY.current;

    curArm.current += (armTarget - curArm.current) * k;
    if (armRef.current) armRef.current.rotation.x = curArm.current;

    curClaw.current += (clawTarget - curClaw.current) * k;
    if (clawL.current) clawL.current.position.x = -curClaw.current;
    if (clawR.current) clawR.current.position.x = curClaw.current;
  });

  return (
    <group ref={group}>
      {/* Shadow */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROBOT_HALF * 2.4, ROBOT_HALF * 2.4]} />
        <meshBasicMaterial color="black" transparent opacity={0.2} />
      </mesh>

      {/* Chassis */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[ROBOT_HALF * 1.8, 0.12, ROBOT_HALF * 1.8]} />
        <meshStandardMaterial color="#4a9a3a" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Wheels */}
      {[
        [-ROBOT_HALF * 0.8, -ROBOT_HALF * 0.7],
        [ROBOT_HALF * 0.8, -ROBOT_HALF * 0.7],
        [-ROBOT_HALF * 0.8, ROBOT_HALF * 0.7],
        [ROBOT_HALF * 0.8, ROBOT_HALF * 0.7],
      ].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.04, wz]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 12]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* Arm + claw at front */}
      <group position={[0, 0.1, -ROBOT_HALF * 0.9]}>
        <group ref={armRef}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <boxGeometry args={[0.04, 0.24, 0.04]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.5} roughness={0.4} />
          </mesh>
          <group position={[0, 0.24, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.12, 0.03, 0.04]} />
              <meshStandardMaterial color="#8b5cf6" metalness={0.4} roughness={0.4} />
            </mesh>
            <group ref={clawL}>
              <mesh position={[0, 0.03, 0]} castShadow>
                <boxGeometry args={[0.02, 0.06, 0.04]} />
                <meshStandardMaterial color="#a78bfa" />
              </mesh>
            </group>
            <group ref={clawR}>
              <mesh position={[0, 0.03, 0]} castShadow>
                <boxGeometry args={[0.02, 0.06, 0.04]} />
                <meshStandardMaterial color="#a78bfa" />
              </mesh>
            </group>
            {state.robot.holding && (
              <mesh position={[0, 0.04, 0]} castShadow>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={0.4} />
              </mesh>
            )}
          </group>
        </group>
      </group>

      {/* Pollen counter on top */}
      {state.robot.pollenCount > 0 && (
        <mesh position={[0, 0.18, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={0.5} />
        </mesh>
      )}

      {/* Heading arrow */}
      <mesh position={[0, 0.02, -ROBOT_HALF - 0.04]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.04, 0.08, 4]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ── Scene ───────────────────────────────────────────────────
function BioBuzzScene({ state }: { state: BioBuzzState }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-6, 8, -6]} intensity={0.3} />

      <GrassTiles />
      <GardenBorder />

      {state.flowers.map((f, i) => (
        <Flower3D key={i} flower={f} />
      ))}
      {state.pollen.map((p, i) => (
        <Pollen3D key={i} pollen={p} />
      ))}
      {state.bins.map((b, i) => (
        <NectarBin3D key={i} bin={b} />
      ))}

      <BioBuzzRobot state={state} />

      <ContactShadows position={[0, 0.01, 0]} opacity={0.3} scale={FIELD_SIZE * 1.3} blur={2} far={4} />

      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
      />
    </>
  );
}

// ── Exported 3D BioBuzz Field ───────────────────────────────
export function BioBuzzField3D({ state }: { state: BioBuzzState }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 10, 10], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#0a1a08"]} />
      <BioBuzzScene state={state} />
    </Canvas>
  );
}
