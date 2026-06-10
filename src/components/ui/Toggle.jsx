
export default function Toggle({ checked, onChange, label }) {
  return (
    <label 
      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
      onClick={(e) => {
        e.preventDefault();
        if (onChange) onChange(!checked);
      }}
    >
      <div style={{
        position: 'relative',
        width: '40px',
        height: '24px',
        backgroundColor: checked ? 'var(--color-primary-teal)' : 'var(--color-border)',
        borderRadius: '12px',
        transition: 'background-color 0.2s',
      }}>
        <div style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '18px' : '2px',
          width: '20px',
          height: '20px',
          backgroundColor: '#fff',
          borderRadius: '50%',
          transition: 'left 0.2s',
          boxShadow: 'var(--shadow-sm)'
        }} />
      </div>
      {label && <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{label}</span>}
    </label>
  );
}
