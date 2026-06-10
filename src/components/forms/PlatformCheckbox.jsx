
export default function PlatformCheckbox({ label, imageSrc, checked, onChange }) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius-input)',
      border: checked ? '2px solid var(--color-primary-teal)' : '1px solid var(--color-border)',
      backgroundColor: checked ? 'var(--color-primary-teal-light)' : 'var(--color-bg-card)',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
        style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary-teal)', cursor: 'pointer' }}
      />
      {imageSrc && (
        <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Placeholder for platform icon */}
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{imageSrc}</span>
        </div>
      )}
      <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>{label}</span>
    </label>
  );
}
