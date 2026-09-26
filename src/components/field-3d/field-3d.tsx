import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { FIELD_TILES, levelSamples, type Frame, type Level } from "@/lib/sim";
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

// ── Sample Block ────────────────────────────────────────���───
function Samples({ level, taken, variant }: { level: Level; taken: number[]; variant: Variant }) {
  return (
    <>
      {levelSamples(level).map((p, i) =>
        taken.includes(i) ? null : variant === "biobuzz" ? (
          <Pollen key={i} x={p.x} y={p.y} i={i} />
        ) : (
          <SampleBlock key={i} x={p.x} y={p.y} />
        ),
      )}
    </>
  );
}

const POLLEN_COLORS = ["#ffb703", "#fb8500", "#e63946", "#8338ec", "#06d6a0"];
function Pollen({ x, y, i }: { x: number; y: number; i: number }) {
  const [wx, wz] = gridToWorld(x, y);
  const c = POLLEN_COLORS[i % POLLEN_COLORS.length]!;
  return (
    <group position={[wx, 0.14, wz]}>
      <mesh castShadow>
        <sphereGeometry args={[0.14, 20, 16]} />
        <meshStandardMaterial color={c} roughness={0.8} emissive={c} emissiveIntensity={0.15} />
      </mesh>
      {Array.from({ length: 10 }).map((_, k) => {
        const a = (k / 10) * Math.PI * 2;
        const e = ((k % 3) - 1) * 0.6;
        return (
          <mesh key={k} position={[Math.cos(a) * 0.13, Math.sin(e) * 0.12, Math.sin(a) * 0.13]}>
            <sphereGeometry args={[0.035, 8, 6]} />
            <meshStandardMaterial color={c} roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function Obstacles({ level, variant }: { level: Level; variant: Variant }) {
  return (
    <>
      {(level.obstacles ?? []).map((o, i) => {
        const [wx, wz] = gridToWorld(o.x, o.y);
        return (
          <group key={i} position={[wx, 0, wz]}>
            <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[TILE * 0.96, TILE * 0.96]} />
              <meshStandardMaterial color={variant === "biobuzz" ? "#7a4a1f" : "#8a1c1c"} roughness={0.9} />
            </mesh>
            {[-0.5, 0.5].map((dx) =>
              [-0.5, 0.5].map((dz) => (
                <mesh key={`${dx}${dz}`} position={[dx, 0.2, dz]} castShadow>
                  <coneGeometry args={[0.14, 0.4, 12]} />
                  <meshStandardMaterial color="#ff6a1a" roughness={0.6} />
                </mesh>
              )),
            )}
          </group>
        );
      })}
    </>
  );
}

// ── BioBuzz decorations: flowers + nectar box ──
const FLOWER_SPOTS: [number, number, string][] = [
  [-5.5, -5.5, "#ff5d8f"], [5.5, -5.5, "#ffd23f"], [-5.5, 5.5, "#a06cd5"], [5.5, 5.5, "#ff8c42"],
  [-5.6, -1.2, "#4cc9f0"], [5.6, 1.4, "#f72585"], [-1.4, 5.6, "#ffd23f"], [1.6, -5.6, "#ff5d8f"],
  [-5.6, 2.5, "#ff8c42"], [5.6, -3, "#a06cd5"],
];
function Flower({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 0.6, 8]} />
        <meshStandardMaterial color="#3a8a3a" />
      </mesh>
      <mesh position={[0.1, 0.22, 0]} rotation={[0, 0, -0.8]}>
        <sphereGeometry args={[0.08, 10, 6]} />
        <meshStandardMaterial color="#4caf50" />
      </mesh>
      {Array.from({ length: 6 }).map((_, k) => {
        const a = (k / 6) * Math.PI * 2;
        return (
          <mesh key={k} position={[Math.cos(a) * 0.13, 0.62, Math.sin(a) * 0.13]} scale={[1, 0.35, 1]} castShadow>
            <sphereGeometry args={[0.1, 12, 8]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.64, 0]}>
        <sphereGeometry args={[0.07, 12, 8]} />
        <meshStandardMaterial color="#5a3a10" roughness={0.9} />
      </mesh>
    </group>
  );
}
function NectarBox({ level }: { level: Level }) {
  if (!level.goal) return null;
  const [wx, wz] = gridToWorld(level.goal.x, level.goal.y);
  return (
    <group position={[wx, 0, wz]}>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE * 0.92, TILE * 0.92]} />
        <meshStandardMaterial color="#f2a900" transparent opacity={0.3} />
      </mesh>
      {[[0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]].map(([dx, dz], k) => (
        <mesh key={k} position={[dx!, 0.15, dz!]} castShadow>
          <boxGeometry args={[dx ? 0.06 : 1.26, 0.3, dx ? 1.26 : 0.06]} />
          <meshStandardMaterial color="#e0a526" metalness={0.2} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.1, 6]} />
        <meshStandardMaterial color="#ffb703" emissive="#ff9e00" emissiveIntensity={0.3} roughness={0.2} />
      </mesh>
    </group>
  );
}

function SampleBlock({ x, y }: { x: number; y: number }) {
  const [wx, wz] = gridToWorld(x, y);
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

// ── BioBuzz central Hive and field pieces ───────────────────
function Hive() {
  const wheel = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (wheel.current) wheel.current.rotation.z += dt * 0.45;
  });
  const baskets = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return { a, color: i % 2 ? "#d93645" : "#3b6fde" };
  });
  return (
    <group position={[0, 1.15, 0]}>
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 3.1, 20]} />
        <meshStandardMaterial color="#aeb5ba" metalness={0.9} roughness={0.28} />
      </mesh>
      <group ref={wheel} rotation={[0, Math.PI / 2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.45, 0.09, 12, 48]} />
          <meshStandardMaterial color="#d1d6da" metalness={0.85} roughness={0.3} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return <mesh key={i} rotation={[0, 0, a]}><boxGeometry args={[0.06, 2.9, 0.06]} /><meshStandardMaterial color="#aeb5ba" metalness={0.8} /></mesh>;
        })}
        {baskets.map(({ a, color }, i) => (
          <group key={i} position={[Math.cos(a) * 1.45, Math.sin(a) * 1.45, 0]}>
            <mesh castShadow><boxGeometry args={[0.32, 0.42, 0.28]} /><meshStandardMaterial color={color} metalness={0.25} roughness={0.55} /></mesh>
            <mesh position={[0, 0.24, 0]}><torusGeometry args={[0.14, 0.025, 8, 18]} /><meshStandardMaterial color="#f2c94c" metalness={0.6} /></mesh>
          </group>
        ))}
      </group>
      {[-1, 1].map((x) => <mesh key={x} position={[x * 0.72, -0.6, 0]} rotation={[0, 0, x * 0.45]} castShadow><boxGeometry args={[0.12, 1.8, 0.12]} /><meshStandardMaterial color="#b9c0c4" metalness={0.85} roughness={0.3} /></mesh>)}
      <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.28, 0.28, 0.12, 24]} /><meshStandardMaterial color="#e0a526" metalness={0.45} /></mesh>
    </group>
  );
}

function CornerTubes() {
  const spots = [[-5.25, -5.25], [5.25, -5.25], [-5.25, 5.25], [5.25, 5.25]] as const;
  return <group>{spots.map(([x, z], i) => <group key={i} position={[x, 0, z]}>
    <mesh position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.24, 0.24, 1.8, 20]} /><meshStandardMaterial color="#3e8f54" metalness={0.25} roughness={0.6} /></mesh>
    <mesh position={[0, 1.35, 0]}><cylinderGeometry args={[0.17, 0.17, 0.95, 20]} /><meshStandardMaterial color="#dff6e7" transparent opacity={0.28} roughness={0.12} /></mesh>
    {Array.from({ length: 4 }, (_, j) => <mesh key={j} position={[0, 1.05 + j * 0.2, 0]}><sphereGeometry args={[0.11, 14, 10]} /><meshStandardMaterial color="#f5c542" emissive="#a76d00" emissiveIntensity={0.18} /></mesh>)}
  </group>)}</group>;
}

function BioBuzzPieces() {
  const pieces = Array.from({ length: 16 }, (_, i) => ({ x: -4.7 + (i % 8) * 1.35, z: i < 8 ? 5.15 : -5.15 }));
  return <group>{pieces.map((p, i) => <mesh key={i} position={[p.x, 0.17, p.z]} castShadow><sphereGeometry args={[0.16, 16, 12]} /><meshStandardMaterial color="#f5c542" roughness={0.7} /></mesh>)}</group>;
}

// ── Scene ───────────────────────────────────────────────────
type Variant = "ftc" | "biobuzz";
function Scene({ frame, level, variant, instant }: { frame: Frame; level: Level; variant: Variant; instant?: boolean }) {
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
      {variant === "biobuzz" ? (
        <>
          <Hive />
          <CornerTubes />
          <BioBuzzPieces />
          <NectarBox level={level} />
          {FLOWER_SPOTS.map(([x, z, c], i) => (
            <Flower key={i} x={x} z={z} color={c} />
          ))}
        </>
      ) : (
        <GoalZone level={level} />
      )}
      <Obstacles level={level} variant={variant} />
      <Samples level={level} taken={frame.taken} variant={variant} />

      <Robot3D frame={frame} {...(instant === undefined ? {} : { instant })} />

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
  variant = "ftc",
  instant,
}: {
  frame: Frame;
  level: Level;
  variant?: Variant;
  instant?: boolean;
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 9, 9], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={[variant === "biobuzz" ? "#10180f" : "#0e0e14"]} />
      <Scene frame={frame} level={level} variant={variant} {...(instant === undefined ? {} : { instant })} />
    </Canvas>
  );
}
