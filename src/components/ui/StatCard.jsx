
export default function StatCard({ label, value, trend, trendLabel, icon: Icon }) {
  const isNeg = trend && trend.toString().startsWith('-');
  return (
    <div className="card">
      <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="eyebrow">{label}</span>
          {Icon && <Icon size={14} color="var(--dust)" strokeWidth={1.5} />}
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </div>
        {(trend || trendLabel) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--hairline)', fontSize: 12 }}>
            <span style={{ color: isNeg ? 'var(--coral)' : 'var(--emerald)', fontWeight: 500 }}>{trend}</span>
            <span style={{ color: 'var(--dust)' }}>{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
