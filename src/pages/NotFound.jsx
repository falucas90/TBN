import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--page)', flexDirection: 'column', gap: '1.5rem', textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{
        border: '1px solid var(--hairline)', padding: '0.6rem 2rem', borderRadius: '6px',
        display: 'inline-block', fontWeight: '700', fontSize: '1rem',
        backgroundColor: 'var(--surface)', marginBottom: '1rem',
      }}>
        CRIVO
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
