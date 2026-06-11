import { Link } from 'react-router-dom';
import { SieveMark, Wordmark } from '../components/ui/Logo';

export default function Signup() {
  return (
    <div className="app-login">
      <div className="login grain">
        <div className="login__brand">
          <SieveMark size={48} color="var(--bone)" strokeWidth={1} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Wordmark size={22} />
            <span className="login__tag">Filtra o ruído. Encontra a margem.</span>
          </div>
        </div>
        <div className="login__card">
          <h1 style={{ fontSize: 17, fontWeight: 600, margin: 0, textAlign: 'center' }}>Beta privada por convite</h1>
          <p style={{ fontSize: 13, color: 'var(--ash)', margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
            O Crivo está em beta fechada. O acesso é feito por convite. Se quer participar, contacte-nos.
          </p>
          <a className="btn btn--primary btn--lg" href="mailto:suporte@crivo.pt" style={{ width: '100%', marginTop: 6 }}>
            Pedir convite
          </a>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ash)', marginTop: 16 }}>
            Já tem conta?{' '}
            <Link to="/login" style={{ color: 'var(--emerald)', fontWeight: 500 }}>Entrar</Link>
          </div>
        </div>
        <div className="login__footnote">v1.0 · Lisboa</div>
      </div>
    </div>
  );
}
