'use client';

interface Props {
  speed: number;
}

export function SpeedIndicator({ speed }: Props) {
  const radius = 85;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const maxSpeed = 120;
  const percentage = (speed / maxSpeed) * 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (value: number) => {
    if (value >= 100) return '#ef4444';
    if (value >= 80) return '#f59e0b';
    return '#10b981';
  };

  const color = getColor(speed);

  return (
    <div className="relative flex flex-col items-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="#1e293b"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xs text-slate-500 font-medium mb-1">СКОРОСТЬ</div>
        <div className="text-5xl font-bold" style={{ color }}>
          {Math.round(speed)}
        </div>
        <div className="text-sm text-slate-500 font-medium">КМ/Ч</div>
      </div>
    </div>
  );
}
