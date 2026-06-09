import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import { BrandLockup } from '../components/ui/Logo';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--page)', flexDirection: 'column', gap: '1.5rem', textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <BrandLockup markSize={28} wordSize={16} />
      </div>

      <div>
        <p style={{ fontSize: '5rem', fontWeight: '700', color: 'var(--hairline)', lineHeight: 1 }}>404</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Página não encontrada</h1>
        <p style={{ color: 'var(--ash)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          A página que procura não existe ou foi removida.
        </p>
        <Link to="/searches">
          <Button>← Voltar ao início</Button>
        </Link>
      </div>
    </div>
  );
}
