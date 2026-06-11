import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SieveMark, Wordmark } from '../components/ui/Logo';

function mapAuthError(error) {
  const msg = error?.message?.toLowerCase() || '';
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Credenciais inválidas. Verifique o seu email e palavra-passe.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email não confirmado. Verifique a sua caixa de entrada.';
  }
  if (msg.includes('too many requests') || error?.status === 429) {
    return 'Demasiadas tentativas. Tente novamente mais tarde.';
  }
  return 'Ocorreu um erro. Tente novamente.';
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@') || !email.includes('.')) {
      setError('Introduza um endereço de email válido.');
      return;
    }
    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <form className="login__card" onSubmit={handleLogin}>
          <div className="field">
            <label className="field__label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              placeholder="joao@standmarques.pt"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="login-password">Palavra-passe</label>
            <input
              id="login-password"
              className="input"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
            />
          </div>
          {error && <p style={{ color: 'var(--coral)', fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%', marginTop: 6 }} disabled={isSubmitting}>
            {isSubmitting ? 'A entrar…' : 'Entrar'}
          </button>
          <div style={{ textAlign: 'center', fontSize: 11.5, marginTop: 16 }}>
            <Link to="/forgot-password" style={{ color: 'var(--dust)' }}>Esqueceu-se da palavra-passe?</Link>
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ash)', marginTop: 4 }}>
            Não tem conta?{' '}
            <Link to="/signup" style={{ color: 'var(--emerald)', fontWeight: 500 }}>Criar conta</Link>
          </div>
        </form>
        <div className="login__footnote">v1.0 · Lisboa</div>
      </div>
    </div>
  );
}
