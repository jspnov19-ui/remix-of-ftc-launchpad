import { FIELD_TILES, type Frame, type Level } from "@/lib/sim";

const T = 100; // svg units per tile
const SIZE = FIELD_TILES * T;
const v = (n: string) => `var(--${n})`;

function Tile({ x, y }: { x: number; y: number }) {
  const alt = (x + y) % 2 === 1;
  const teeth = [];
  // interlocking puzzle edges of foam tiles
  for (let i = 1; i < 5; i++) {
    teeth.push(
      <rect key={`t${i}`} x={x * T + i * 20 - 4} y={y * T - 2} width={8} height={4} fill={v("field-seam")} opacity={0.6} />,
      <rect key={`l${i}`} x={x * T - 2} y={y * T + i * 20 - 4} width={4} height={8} fill={v("field-seam")} opacity={0.6} />,
    );
  }
  return (
    <g>
      <rect x={x * T} y={y * T} width={T} height={T} fill={v(alt ? "field-tile-alt" : "field-tile")} />
      <rect x={x * T} y={y * T} width={T} height={T} fill="url(#foam)" />
      <rect x={x * T + 0.5} y={y * T + 0.5} width={T - 1} height={T - 1} fill="none" stroke={v("field-seam")} strokeWidth={1.5} />
      {x > 0 && y > 0 && teeth}
    </g>
  );
}

function Robot({ frame }: { frame: Frame }) {
  const armLen = frame.arm === "up" ? 18 : 30;
  const clawGap = frame.claw === "open" ? 9 : 4;
  const wheel = (cx: number, cy: number, flip: boolean) => (
    <g key={`${cx}${cy}`} transform={`translate(${cx} ${cy})`}>
      <rect x={-6} y={-11} width={12} height={22} rx={3} fill={v("robot-wheel")} />
      {[-7, -2, 3, 8].map((ry) => (
        <line key={ry} x1={-5} y1={ry - (flip ? -3 : 3)} x2={5} y2={ry + (flip ? -3 : 3)} stroke={v("robot-roller")} strokeWidth={1.6} />
      ))}
    </g>
  );
  return (
    <g
      style={{
        transform: `translate(${frame.x * T + T / 2}px, ${frame.y * T + T / 2}px) rotate(${frame.heading}deg)`,
        transition: "transform 0.75s cubic-bezier(.45,.05,.3,1)",
      }}
    >
      {/* shadow */}
      <rect x={-37} y={-33} width={78} height={76} rx={6} fill="black" opacity={0.35} filter="url(#blur)" />
      {/* wheels (mecanum) */}
      {wheel(-31, -22, false)}
      {wheel(31, -22, true)}
      {wheel(-31, 22, true)}
      {wheel(31, 22, false)}
      {/* aluminum frame */}
      <rect x={-25} y={-34} width={50} height={68} rx={3} fill={v("robot-plate")} stroke={v("robot-frame")} strokeWidth={4} />
      {[-18, 0, 18].map((hy) => (
        <line key={hy} x1={-23} y1={hy} x2={23} y2={hy} stroke={v("robot-frame")} strokeWidth={1} opacity={0.35} strokeDasharray="2 3" />
      ))}
      {/* control hub + battery */}
      <rect x={-15} y={4} width={30} height={20} rx={2} fill={v("robot-hub")} />
      <circle cx={-9} cy={10} r={1.6} fill={v("field-yellow")} />
      <rect x={-12} y={-18} width={24} height={12} rx={2} fill={v("robot-wheel")} />
      {/* team number plate */}
      <rect x={-25} y={28} width={50} height={9} fill={v("field-blue")} />
      <text x={0} y={35} textAnchor="middle" fontSize={7} fontWeight={700} fill="white" fontFamily="monospace">19655</text>
      {/* arm + claw */}
      <g style={{ transition: "all .5s" }}>
        <rect x={-4} y={-34 - armLen} width={8} height={armLen + 6} fill={v("robot-arm")} stroke={v("robot-frame")} strokeWidth={1} />
        <rect x={-clawGap - 4} y={-38 - armLen} width={4} height={10} fill={v("robot-frame")} style={{ transition: "x .3s" }} />
        <rect x={clawGap} y={-38 - armLen} width={4} height={10} fill={v("robot-frame")} style={{ transition: "x .3s" }} />
        {frame.holding && (
          <rect x={-5} y={-40 - armLen} width={10} height={14} rx={1.5} fill={v("field-yellow")} stroke={v("field-yellow-dark")} />
        )}
      </g>
      {/* heading arrow */}
      <path d="M0 -30 L5 -22 L-5 -22 Z" fill={v("field-yellow")} opacity={0.9} />
    </g>
  );
}

export function FieldView({ frame, level, showSample }: { frame: Frame; level: Level; showSample: boolean }) {
  const tiles = [];
  for (let y = 0; y < FIELD_TILES; y++) for (let x = 0; x < FIELD_TILES; x++) tiles.push(<Tile key={`${x}-${y}`} x={x} y={y} />);
  const g = level.goal;
  const s = level.sample;
  return (
    <svg viewBox={`-24 -24 ${SIZE + 48} ${SIZE + 48}`} className="block h-full w-full" role="img" aria-label="Top-down FTC field with robot">
      <defs>
        <filter id="blur"><feGaussianBlur stdDeviation="4" /></filter>
        <pattern id="foam" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.6" fill="white" opacity="0.05" />
          <circle cx="4.5" cy="4" r="0.5" fill="black" opacity="0.08" />
        </pattern>
        <linearGradient id="wall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.35" />
          <stop offset="1" stopColor="white" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      {/* perimeter: aluminum rail + polycarbonate wall */}
      <rect x={-24} y={-24} width={SIZE + 48} height={SIZE + 48} rx={8} fill={v("field-rail")} />
      <rect x={-16} y={-16} width={SIZE + 32} height={SIZE + 32} rx={4} fill="url(#wall)" stroke={v("field-wall")} />
      {tiles}
      {/* alliance tape */}
      <rect x={0} y={SIZE - 4} width={SIZE / 2} height={4} fill={v("field-blue")} />
      <rect x={SIZE / 2} y={SIZE - 4} width={SIZE / 2} height={4} fill={v("field-red")} />
      <rect x={0} y={0} width={4} height={SIZE} fill={v("field-blue")} opacity={0.8} />
      <rect x={SIZE - 4} y={0} width={4} height={SIZE} fill={v("field-red")} opacity={0.8} />
      {/* starting box */}
      <rect x={level.start.x * T + 8} y={level.start.y * T + 8} width={T - 16} height={T - 16} fill="none" stroke="white" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="8 6" />
      {/* goal zone (net/basket) */}
      {g && (
        <g>
          <rect x={g.x * T + 4} y={g.y * T + 4} width={T - 8} height={T - 8} fill={v("field-blue")} fillOpacity={0.18} stroke={v("field-blue")} strokeWidth={5} />
          <path d={`M${g.x * T + 4} ${g.y * T + 4} L${g.x * T + T - 4} ${g.y * T + T - 4} M${g.x * T + T - 4} ${g.y * T + 4} L${g.x * T + 4} ${g.y * T + T - 4}`} stroke={v("field-blue")} strokeOpacity={0.4} strokeWidth={2} />
          <text x={g.x * T + T / 2} y={g.y * T + T / 2 + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill="white" opacity={0.85}>GOAL</text>
        </g>
      )}
      {/* sample */}
      {s && showSample && (
        <g transform={`translate(${s.x * T + T / 2} ${s.y * T + T / 2}) rotate(15)`}>
          <rect x={-9} y={-18} width={18} height={36} rx={3} fill="black" opacity={0.3} filter="url(#blur)" />
          <rect x={-8} y={-17} width={16} height={34} rx={3} fill={v("field-yellow")} stroke={v("field-yellow-dark")} strokeWidth={2} />
          <rect x={-4} y={-12} width={8} height={24} rx={2} fill={v("field-yellow-dark")} opacity={0.4} />
        </g>
      )}
      <Robot frame={frame} />
    </svg>
  );
}
