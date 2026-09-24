import { useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { FIELD_TILES, type Frame, type Level } from "@/lib/sim";
import { Robot3D } from "./robot-3d";

const TILE = 2;
const FIELD_SIZE = FIELD_TILES * TILE;

function gridToWorld(x: number, y: number): [number, number] {
  const wx = x * TILE + TILE / 2 - FIELD_SIZE / 2;
  const wz = y * TILE + TILE / 2 - FIELD_SIZE / 2;
  return [wx, -wz];
}

// ── Foam Field Tiles ────────────────────────────────────────
function FieldTiles() {
  const tiles = useMemo(() => {
    const arr: { x: number; z: number; alt: boolean }[] = [];
    for (let y = 0; y < FIELD_TILES; y++) {
      for (let x = 0; x < FIELD_TILES; x++) {
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
        <mesh
          key={i}
          position={[t.x, 0, t.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[TILE, TILE]} />
          <meshStandardMaterial
            color={t.alt ? "#6b6b73" : "#62626a"}
            roughness={0.95}
            metalness={0.02}
          />
        </mesh>
      ))}
      {/* Grid lines */}
      {Array.from({ length: FIELD_TILES + 1 }).map((_, i) => {
        const offset = i * TILE - FIELD_SIZE / 2;
        return (
          <group key={i}>
            <mesh position={[offset, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.015, FIELD_SIZE]} />
              <meshBasicMaterial color="#2a2a30" transparent opacity={0.6} />
            </mesh>
            <mesh position={[0, 0.002, offset]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
              <planeGeometry args={[0.015, FIELD_SIZE]} />
              <meshBasicMaterial color="#2a2a30" transparent opacity={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Alliance Floor Borders ──────────────────────────────────
function AllianceBorders() {
  const borderH = 0.02;
  const borderW = 0.15;
  // Blue side: bottom of field (y=5 in grid = +z in world)
  // Red side: top of field (y=0 in grid = -z in world)
  return (
    <group>
      {/* Blue bottom border */}
      <mesh position={[0, borderH / 2, FIELD_SIZE / 2 - borderW / 2]} castShadow>
        <boxGeometry args={[FIELD_SIZE / 2, borderH, borderW]} />
        <meshStandardMaterial color="#3b6fde" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Red top border */}
      <mesh position={[0, borderH / 2, -FIELD_SIZE / 2 + borderW / 2]} castShadow>
        <boxGeometry args={[FIELD_SIZE / 2, borderH, borderW]} />
        <meshStandardMaterial color="#d63b3b" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Blue left border */}
      <mesh position={[-FIELD_SIZE / 2 + borderW / 2, borderH / 2, 0]} castShadow>
        <boxGeometry args={[borderW, borderH, FIELD_SIZE]} />
        <meshStandardMaterial color="#3b6fde" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Red right border */}
      <mesh position={[FIELD_SIZE / 2 - borderW / 2, borderH / 2, 0]} castShadow>
        <boxGeometry args={[borderW, borderH, FIELD_SIZE]} />
        <meshStandardMaterial color="#d63b3b" metalness={0.3} roughness={0.6} />
      </mesh>
    </group>
  );
}

// ── Translucent Perimeter Walls ─────────────────────────────
function PerimeterWalls() {
  const wallH = 0.5;
  const wallT = 0.08;
  const mat = (
    <meshStandardMaterial
      color="#a0c4e8"
      transparent
      opacity={0.25}
      metalness={0.1}
      roughness={0.1}
      side={THREE.DoubleSide}
    />
  );
  return (
    <group>
      {/* Front wall (−z) */}
      <mesh position={[0, wallH / 2, -FIELD_SIZE / 2 - wallT / 2]} castShadow>
        <boxGeometry args={[FIELD_SIZE + wallT * 2, wallH, wallT]} />
        {mat}
      </mesh>
      {/* Back wall (+z) */}
      <mesh position={[0, wallH / 2, FIELD_SIZE / 2 + wallT / 2]} castShadow>
        <boxGeometry args={[FIELD_SIZE + wallT * 2, wallH, wallT]} />
        {mat}
      </mesh>
      {/* Left wall (−x) */}
      <mesh position={[-FIELD_SIZE / 2 - wallT / 2, wallH / 2, 0]} castShadow>
        <boxGeometry args={[wallT, wallH, FIELD_SIZE]} />
        {mat}
      </mesh>
      {/* Right wall (+x) */}
      <mesh position={[FIELD_SIZE / 2 + wallT / 2, wallH / 2, 0]} castShadow>
        <boxGeometry args={[wallT, wallH, FIELD_SIZE]} />
        {mat}
      </mesh>
      {/* Aluminum rail at base */}
      <mesh position={[0, 0.03, -FIELD_SIZE / 2 - wallT / 2]}>
        <boxGeometry args={[FIELD_SIZE + wallT * 2, 0.06, wallT]} />
        <meshStandardMaterial color="#b8bcc0" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.03, FIELD_SIZE / 2 + wallT / 2]}>
        <boxGeometry args={[FIELD_SIZE + wallT * 2, 0.06, wallT]} />
        <meshStandardMaterial color="#b8bcc0" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[-FIELD_SIZE / 2 - wallT / 2, 0.03, 0]}>
        <boxGeometry args={[wallT, 0.06, FIELD_SIZE]} />
        <meshStandardMaterial color="#b8bcc0" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[FIELD_SIZE / 2 + wallT / 2, 0.03, 0]}>
        <boxGeometry args={[wallT, 0.06, FIELD_SIZE]} />
        <meshStandardMaterial color="#b8bcc0" metalness={0.85} roughness={0.35} />
      </mesh>
    </group>
  );
}

// ── Starting Box ────────────────────────────────────────────
function StartingBox({ level }: { level: Level }) {
  const [wx, wz] = gridToWorld(level.start.x, level.start.y);
  return (
    <mesh position={[wx, 0.003, wz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[TILE * 0.85, TILE * 0.85]} />
      <meshBasicMaterial
        color="white"
        transparent
        opacity={0.08}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Goal Zone ───────────────────────────────────────────────
function GoalZone({ level }: { level: Level }) {
  if (!level.goal) return null;
  const [wx, wz] = gridToWorld(level.goal.x, level.goal.y);
  return (
    <group position={[wx, 0, wz]}>
      {/* Floor marker */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE * 0.92, TILE * 0.92]} />
        <meshStandardMaterial
          color="#3b6fde"
          transparent
          opacity={0.25}
          emissive="#3b6fde"
          emissiveIntensity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Border frame */}
      {[-1, 1].map((sx) => (
        <mesh key={`gx-${sx}`} position={[sx * TILE * 0.46, 0.02, 0]}>
          <boxGeometry args={[0.04, 0.04, TILE * 0.92]} />
          <meshStandardMaterial color="#3b6fde" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      {[-1, 1].map((sz) => (
        <mesh key={`gz-${sz}`} position={[0, 0.02, sz * TILE * 0.46]}>
          <boxGeometry args={[TILE * 0.92, 0.04, 0.04]} />
          <meshStandardMaterial color="#3b6fde" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── Sample Block ────────────────────────────────────────────
function SampleBlock({ level, visible }: { level: Level; visible: boolean }) {
  if (!level.sample || !visible) return null;
  const [wx, wz] = gridToWorld(level.sample.x, level.sample.y);
  return (
    <group position={[wx, 0.08, wz]} rotation={[0, (15 * Math.PI) / 180, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.28, 0.16, 0.28]} />
        <meshStandardMaterial
          color="#f5d020"
          emissive="#cc9900"
          emissiveIntensity={0.12}
          metalness={0.25}
          roughness={0.55}
        />
      </mesh>
      {/* Inner detail */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.14, 0.12, 0.14]} />
        <meshStandardMaterial color="#d4a800" metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ── Scene ───────────────────────────────────────────────────
function Scene({
  frame,
  level,
  showSample,
}: {
  frame: Frame;
  level: Level;
  showSample: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight position={[-4, 6, -4]} intensity={0.3} />

      <FieldTiles />
      <AllianceBorders />
      <PerimeterWalls />
      <StartingBox level={level} />
      <GoalZone level={level} />
      <SampleBlock level={level} visible={showSample} />

      <Robot3D frame={frame} />

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.35}
        scale={FIELD_SIZE * 1.2}
        blur={2}
        far={4}
      />

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

// ── Exported 3D Field View ──────────────────────────────────
export function FieldView3D({
  frame,
  level,
  showSample,
}: {
  frame: Frame;
  level: Level;
  showSample: boolean;
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 9, 9], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#0e0e14"]} />
      <Scene frame={frame} level={level} showSample={showSample} />
    </Canvas>
  );
}
