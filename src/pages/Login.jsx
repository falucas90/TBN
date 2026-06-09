import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui';
import { FormField } from '../components/forms';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { BrandLockup } from '../components/ui/Logo';

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
  const { isAuthenticated, login, loginGoogle } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/searches', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await loginGoogle();
    } catch (err) {
      setError(mapAuthError(err));
    }
  };

  return (
    <div className="login-shell">
      {/* Left Pane */}
      <div className="login-left">
        <div>
          <div style={{ marginBottom: '4rem' }}>
            <BrandLockup markSize={32} wordSize={18} />
          </div>

          <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 600, marginBottom: '1.25rem', maxWidth: 460, lineHeight: 'var(--lh-tight)', letterSpacing: 'var(--tracking-tighter)' }}>
            Inteligência de sourcing para stands portugueses
          </h1>
          <p style={{ fontSize: 'var(--fs-lg)', color: 'var(--ash)', maxWidth: 400, lineHeight: 'var(--lh-body)' }}>
            Monitorize anúncios europeus. Obtenha cálculos de ISV automáticos. Receba alertas pelo WhatsApp quando a rentabilidade for certa.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '2.5rem', marginTop: '2rem' }}>
          {[['110k+', 'carros importados/ano'], ['±5%', 'precisão de ISV'], ['€99', '/mês, cancele quando quiser']].map(([num, desc]) => (
            <div key={num}>
              <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 600, marginBottom: 4, letterSpacing: 'var(--tracking-tight)' }}>{num}</div>
              <div style={{ color: 'var(--dust)', fontSize: 'var(--fs-micro)', lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane */}
      <div className="login-right" style={{ flexDirection: 'column' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 600, marginBottom: 6, letterSpacing: 'var(--tracking-tight)' }}>Bem-vindo de volta</h2>
          <p style={{ color: 'var(--dust)', marginBottom: '2.5rem', fontSize: 'var(--fs-body)' }}>Aceda à sua conta</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Email" required>
              <input
                type="email"
                className="input"
                placeholder="stand@exemplo.pt"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
              />
            </FormField>
            <FormField label="Palavra-passe" required>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                />
                <span
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 12, top: 10, fontSize: 12, color: 'var(--dust)', cursor: 'pointer', userSelect: 'none' }}
                >
                  {showPassword ? 'hide' : 'show'}
                </span>
              </div>
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <Link to="/forgot-password" style={{ color: 'var(--emerald)', fontSize: 12 }}>Esqueceu-se da palavra-passe?</Link>
              </div>
            </FormField>

            {error && (
              <p style={{ color: 'var(--coral)', fontSize: 13, margin: 0 }}>{error}</p>
            )}

            <div style={{ marginTop: 4 }}>
              <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
                {isSubmitting ? 'A entrar...' : 'Entrar'}
              </Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0', color: 'var(--chalk)' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
              <span style={{ padding: '0 12px', fontSize: 12 }}>ou</span>
              <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
            </div>

            <Button type="button" variant="default" fullWidth onClick={handleGoogle}>
              Continuar com o Google
            </Button>
          </form>

          <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: 13, color: 'var(--dust)' }}>
            Não tem uma conta? <Link to="/signup" style={{ color: 'var(--emerald)', fontWeight: 500 }}>Registe-se</Link>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', padding: '1.5rem 4rem', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--dust)', borderTop: '1px solid var(--hairline)' }}>
          <div>© 2026 Crivo</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[['Termos', 'Termos de serviço em breve.'], ['Privacidade', 'Política de privacidade em breve.'], ['Suporte', 'Para suporte, contacte support@crivo.pt']].map(([label, msg]) => (
              <button key={label} onClick={() => addToast(msg, 'info')} style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', fontSize: 'inherit', cursor: 'pointer' }}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
