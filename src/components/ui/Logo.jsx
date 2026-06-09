// SieveMark: circle with perforated dot grid — the Crivo brand mark
export function SieveMark({ size = 22, color = "currentColor", strokeWidth = 2.5 }) {
  const r = 50, cx = 50, cy = 50;
  const dots = [];
  const step = 11, dotR = 2.8;
  for (let y = -r; y <= r; y += step) {
    for (let x = -r; x <= r; x += step) {
      if (Math.sqrt(x * x + y * y) <= r - 10) dots.push([cx + x, cy + y]);
    }
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r - strokeWidth / 2} fill="none" stroke={color} strokeWidth={strokeWidth} />
      <circle cx={cx} cy={cy} r={r - 8} fill="none" stroke={color} strokeWidth={strokeWidth * 0.5} opacity="0.35" />
      {dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={dotR} fill={color} />)}
    </svg>
  );
}

// Wordmark: "CRIVO" with three sieve dots inside the O
export function Wordmark({ size = 22, color = "var(--bone)" }) {
  return (
    <span style={{
      fontFamily: 'var(--font-display)',
      fontSize: size,
      fontWeight: 600,
      letterSpacing: '0.05em',
      color,
      display: 'inline-flex',
      alignItems: 'center',
      lineHeight: 1,
    }}>
      CRIV<span style={{ position: 'relative', display: 'inline-block' }}>
        O
        <span style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', gap: size * 0.05,
          pointerEvents: 'none',
        }}>
          <span style={{ width: size * 0.06, height: size * 0.06, borderRadius: '50%', background: 'var(--emerald)' }} />
          <span style={{ width: size * 0.06, height: size * 0.06, borderRadius: '50%', background: color, opacity: 0.5 }} />
          <span style={{ width: size * 0.06, height: size * 0.06, borderRadius: '50%', background: color, opacity: 0.5 }} />
        </span>
      </span>
    </span>
  );
}

// BrandLockup: SieveMark + Wordmark side by side
export function BrandLockup({ markSize = 28, wordSize = 18 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <SieveMark size={markSize} color="var(--emerald)" />
      <Wordmark size={wordSize} />
    </div>
  );
}
