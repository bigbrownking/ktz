'use client';

interface Props {
  speed: number;
  maxSpeed?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function Speedometer({ speed, maxSpeed = 120 }: Props) {
  const cx = 100;
  const cy = 100;
  const trackR = 80;
  const START = 135;
  const END = 405;
  const SWEEP = END - START;

  const clampedSpeed = Math.max(0, Math.min(speed, maxSpeed));
  const ratio = clampedSpeed / maxSpeed;
  const needleAngle = START + ratio * SWEEP;

  const getArcColor = () => {
    if (speed >= 100) return '#ef4444';
    if (speed >= 80) return '#f59e0b';
    return '#10b981';
  };

  const tip = polarToCartesian(cx, cy, 60, needleAngle);
  const base1 = polarToCartesian(cx, cy, 10, needleAngle - 90);
  const base2 = polarToCartesian(cx, cy, 10, needleAngle + 90);

  const ticks = [];
  const labelAngles: { angle: number; label: string }[] = [];
  const majorStep = 20;
  const majorCount = maxSpeed / majorStep;
  for (let i = 0; i <= majorCount; i++) {
    const val = i * majorStep;
    const angle = START + (val / maxSpeed) * SWEEP;
    const outer = polarToCartesian(cx, cy, trackR, angle);
    const innerMaj = polarToCartesian(cx, cy, trackR - 12, angle);
    ticks.push(<line key={`maj-${i}`} x1={outer.x} y1={outer.y} x2={innerMaj.x} y2={innerMaj.y} stroke="#475569" strokeWidth={2} />);
    labelAngles.push({ angle, label: val.toString() });

    if (i < majorCount) {
      for (let m = 1; m < 4; m++) {
        const mVal = val + (majorStep / 4) * m;
        const mAngle = START + (mVal / maxSpeed) * SWEEP;
        const mOuter = polarToCartesian(cx, cy, trackR, mAngle);
        const mInner = polarToCartesian(cx, cy, trackR - 6, mAngle);
        ticks.push(<line key={`min-${i}-${m}`} x1={mOuter.x} y1={mOuter.y} x2={mInner.x} y2={mInner.y} stroke="#334155" strokeWidth={1} />);
      }
    }
  }

  const progressEnd = START + ratio * SWEEP;
  const arcColor = getArcColor();

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 195" className="w-full max-w-[260px]">
        <path
          d={arcPath(cx, cy, trackR, START, END)}
          fill="none"
          stroke="#1e293b"
          strokeWidth={14}
          strokeLinecap="round"
        />

        <path d={arcPath(cx, cy, trackR, START, START + SWEEP * 0.67)} fill="none" stroke="#10b98130" strokeWidth={14} />
        <path d={arcPath(cx, cy, trackR, START + SWEEP * 0.67, START + SWEEP * 0.84)} fill="none" stroke="#f59e0b30" strokeWidth={14} />
        <path d={arcPath(cx, cy, trackR, START + SWEEP * 0.84, END)} fill="none" stroke="#ef444430" strokeWidth={14} />

        {ratio > 0 && (
          <path
            d={arcPath(cx, cy, trackR, START, progressEnd)}
            fill="none"
            stroke={arcColor}
            strokeWidth={14}
            strokeLinecap="round"
            style={{ transition: 'all 0.4s ease', filter: `drop-shadow(0 0 4px ${arcColor})` }}
          />
        )}

        {ticks}

        {labelAngles.map(({ angle, label }) => {
          const pos = polarToCartesian(cx, cy, trackR - 22, angle);
          return (
            <text key={label} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fill="#64748b" fontSize={7} fontFamily="system-ui">
              {label}
            </text>
          );
        })}

        <polygon
          points={`${tip.x},${tip.y} ${base1.x},${base1.y} ${base2.x},${base2.y}`}
          fill={arcColor}
          style={{ transition: 'all 0.4s ease', filter: `drop-shadow(0 0 3px ${arcColor})` }}
        />
        <circle cx={cx} cy={cy} r={8} fill="#1e293b" stroke="#334155" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={4} fill={arcColor} />

        <text x={cx} y={cy + 32} textAnchor="middle" fill={arcColor} fontSize={24} fontWeight="bold" fontFamily="system-ui" style={{ transition: 'fill 0.4s' }}>
          {Math.round(clampedSpeed)}
        </text>
        <text x={cx} y={cy + 44} textAnchor="middle" fill="#64748b" fontSize={7} fontFamily="system-ui">
          КМ/Ч
        </text>

        <text x={32} y={168} textAnchor="middle" fill="#475569" fontSize={7} fontFamily="system-ui">0</text>
        <text x={168} y={168} textAnchor="middle" fill="#475569" fontSize={7} fontFamily="system-ui">{maxSpeed}</text>
      </svg>

      <div className="mt-1 text-xs text-slate-500 uppercase tracking-widest">СПИДОМЕТР</div>
    </div>
  );
}
