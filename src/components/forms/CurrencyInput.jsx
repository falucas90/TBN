
export default function CurrencyInput({ value, onChange, ...props }) {
  const handleFocus = e => {
    e.target.parentElement.style.borderColor = 'var(--emerald)';
    e.target.parentElement.style.background = 'var(--slate)';
  };
  const handleBlur = e => {
    e.target.parentElement.style.borderColor = 'var(--hairline)';
    e.target.parentElement.style.background = 'var(--graphite)';
  };

  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center',
      background: 'var(--graphite)',
      border: '1px solid var(--hairline)',
      borderRadius: 'var(--r-md)',
      height: '36px',
      transition: 'border-color var(--t-fast) var(--ease), background var(--t-fast) var(--ease)',
    }}>
      <span style={{
        position: 'absolute', left: '12px',
        color: 'var(--dust)', fontSize: '13px', fontWeight: '500',
        pointerEvents: 'none',
      }}>
        €
      </span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          width: '100%', background: 'transparent', border: 'none',
          color: 'var(--bone)',
          padding: '0 12px 0 28px',
          fontSize: '13px', outline: 'none', fontFamily: 'inherit',
          height: '100%',
        }}
        {...props}
      />
    </div>
  );
}
