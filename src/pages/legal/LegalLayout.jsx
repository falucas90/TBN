import { Link } from 'react-router-dom';
import { BrandLockup } from '../../components/ui/Logo';

export default function LegalLayout({ title, updated, children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', borderBottom: '1px solid var(--hairline)' }}>
        <Link to="/login" aria-label="Crivo">
          <BrandLockup markSize={28} wordSize={16} />
        </Link>
        <Link to="/login" style={{ color: 'var(--emerald)', fontSize: 13 }}>← Voltar</Link>
      </header>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>{title}</h1>
        <p style={{ color: 'var(--dust)', fontSize: 12, marginBottom: '2rem' }}>Última atualização: {updated}</p>
        <div className="legal-body" style={{ color: 'var(--ash)', fontSize: 14, lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
