
/* ——————————————————————————— Sieve Mark ——————————————————————————— */
export function SieveMark({ size = 22, color = "currentColor", strokeWidth = 2.5 }) {
  const r = 50;
  const cx = 50;
  const cy = 50;
  const dots = [];
  const step = 11;
  const dotR = 2.8;
  for (let y = -r; y <= r; y += step) {
    for (let x = -r; x <= r; x += step) {
      const dist = Math.sqrt(x * x + y * y);
      if (dist <= r - 10) {
        dots.push([cx + x, cy + y]);
      }
    }
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r - strokeWidth / 2} fill="none" stroke={color} strokeWidth={strokeWidth} />
      <circle cx={cx} cy={cy} r={r - 8} fill="none" stroke={color} strokeWidth={strokeWidth * 0.5} opacity="0.35" />
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={dotR} fill={color} />
      ))}
    </svg>
  );
}

/* ——————————————————————————— Wordmark ——————————————————————————— */
export function Wordmark({ size = 22, color = "var(--bone)" }) {
  const s = Number(size);
  const dotSize = s * 0.1;
  const gap = s * 0.06;
  const w = dotSize * 3 + gap * 2;
  return (
    <span style={{
      fontFamily: "var(--font-display)",
      fontSize: s,
      fontWeight: 600,
      letterSpacing: "0.05em",
      color,
      display: "inline-flex",
      alignItems: "center",
      lineHeight: 1,
    }}>
      CRIV<span style={{ position: "relative", display: "inline-block" }}>
        O
        <svg 
          width={w} height={dotSize} viewBox={`0 0 ${w} ${dotSize}`}
          style={{
            position: "absolute",
            left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none"
          }}
        >
          <circle cx={dotSize/2} cy={dotSize/2} r={dotSize/2} fill="var(--emerald)" />
          <circle cx={dotSize*1.5 + gap} cy={dotSize/2} r={dotSize/2} fill={color} opacity="0.5" />
          <circle cx={dotSize*2.5 + gap*2} cy={dotSize/2} r={dotSize/2} fill={color} opacity="0.5" />
        </svg>
      </span>
    </span>
  );
}

/* ——————————————————————————— Icons ——————————————————————————— */
export const Icon = ({ name, size = 16, strokeWidth = 1.5, color = "currentColor" }) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
    calc: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    check: <path d="M20 6 9 17l-5-5"/>,
    chevron: <path d="m6 9 6 6 6-6"/>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
    link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
    euro: <><path d="M18 7a6 6 0 1 0 0 10"/><path d="M3 11h10M3 15h10"/></>,
    car: <><path d="M5 17h14M7 17v-4l2-5h6l2 5v4"/><circle cx="8.5" cy="17.5" r="1.5"/><circle cx="15.5" cy="17.5" r="1.5"/></>,
    whatsapp: <><path d="M21 12a9 9 0 1 1-3.2-6.9"/><path d="M21 4v5h-5"/></>,
    close: <path d="M18 6 6 18M6 6l18 18" />,
    filter: <path d="M3 5h18l-7 9v6l-4-2v-4Z"/>,
    alert: <><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    sparkle: <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></>,
    sieve: null,
  };
  if (name === "sieve") return <SieveMark size={size} color={color} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      {paths[name]}
    </svg>
  );
};

/* ——————————————————————————— Badge / pill / dot ——————————————————————————— */
export const Pill = ({ children, tone = "neutral", mono = false }) => {
  const cls = `pill ${tone === "emerald" ? "pill--emerald" : tone === "amber" ? "pill--amber" : tone === "coral" ? "pill--coral" : ""} ${mono ? "pill--mono" : ""}`;
  return <span className={cls}>{children}</span>;
};
export const Dot = ({ tone = "dust" }) => <span className={`dot ${tone === "emerald" ? "dot--emerald" : tone === "amber" ? "dot--amber" : "dot--dust"}`} />;

/* ——————————————————————————— Button ——————————————————————————— */
export const Btn = ({ variant = "default", size, children, icon, iconRight, ...props }) => {
  const cls = `btn ${variant === "primary" ? "btn--primary" : variant === "ghost" ? "btn--ghost" : variant === "danger" ? "btn--danger" : ""} ${size === "sm" ? "btn--sm" : size === "lg" ? "btn--lg" : ""}`;
  return (
    <button className={cls} {...props}>
      {icon && <Icon name={icon} size={14} />}
      {children}
      {iconRight && <Icon name={iconRight} size={14} />}
    </button>
  );
};

/* ——————————————————————————— Segmented control ——————————————————————————— */
export const Seg = ({ options, value, onChange }) => (
  <div className="seg">
    {options.map(opt => (
      <button
        key={opt}
        type="button"
        className="seg__opt"
        aria-selected={value === opt}
        onClick={() => onChange && onChange(opt)}
      >
        {opt}
      </button>
    ))}
  </div>
);

/* ——————————————————————————— Switch ——————————————————————————— */
export const Switch = ({ checked, onChange }) => (
  <button type="button" className="switch" aria-checked={checked} role="switch" onClick={() => onChange && onChange(!checked)} />
);

/* ——————————————————————————— NumPair ——————————————————————————— */
export const NumPair = ({ label, value, emerald, big }) => (
  <div className="num-pair">
    <span className="num-pair__label">{label}</span>
    <span className={`num-pair__value ${big ? "num-pair__value--big" : ""} ${emerald ? "num-pair__value--emerald" : ""}`}>{value}</span>
  </div>
);
