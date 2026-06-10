
export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex',
      backgroundColor: 'var(--color-bg-page)',
      padding: '0.25rem',
      borderRadius: 'var(--radius-input)',
      gap: '0.25rem'
    }}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'calc(var(--radius-input) - 2px)',
              border: 'none',
              backgroundColor: isSelected ? 'var(--color-bg-card)' : 'transparent',
              color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
              fontWeight: isSelected ? '600' : '500',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
