import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui';
import { FormField } from '../components/forms';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';

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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#fff', color: '#111' }}>
      {/* Left Pane (Beige/Brand) */}
      <div style={{
        flex: 1, backgroundColor: '#F6F5F2', padding: '4rem',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{
            border: '1px solid #D6D5D1', padding: '0.6rem 2rem',
            borderRadius: '6px', display: 'inline-block', fontWeight: '700',
            fontSize: '1rem', backgroundColor: '#fff', marginBottom: '4rem'
          }}>
            CRIVO
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1.25rem', maxWidth: '460px', lineHeight: '1.2' }}>
            Inteligência de sourcing para stands portugueses
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#444', maxWidth: '400px', lineHeight: '1.6' }}>
            Monitorize anúncios europeus. Obtenha cálculos de ISV automáticos. Receba alertas pelo WhatsApp quando a rentabilidade for certa.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '2.5rem', marginTop: '2rem' }}>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>110k+</div>
            <div style={{ color: '#555', fontSize: '0.9rem', lineHeight: '1.3' }}>carros<br/>importados/ano</div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>±5%</div>
            <div style={{ color: '#555', fontSize: '0.9rem', lineHeight: '1.3' }}>precisão<br/>de ISV</div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>€99</div>
            <div style={{ color: '#555', fontSize: '0.9rem', lineHeight: '1.3' }}>/mês, cancele<br/>quando quiser</div>
          </div>
        </div>
      </div>

      {/* Right Pane (Form) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ width: '100%', maxWidth: '460px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Bem-vindo de volta</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2.5rem' }}>Aceda à sua conta</p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                    style={{ position: 'absolute', right: '12px', top: '12px', fontSize: '0.875rem', color: '#666', cursor: 'pointer', userSelect: 'none' }}
                  >
                    {showPassword ? 'hide' : 'show'}
                  </span>
                </div>
                <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                  <Link to="/forgot-password" style={{ color: '#0066FF', fontSize: '0.875rem', textDecoration: 'none' }}>Esqueceu-se da palavra-passe?</Link>
                </div>
              </FormField>

              {error && (
                <p style={{ color: 'var(--color-danger-text)', fontSize: '0.875rem', margin: 0 }}>{error}</p>
              )}

              <div style={{ marginTop: '0.5rem' }}>
                <Button
                  type="submit"
                  fullWidth
                  disabled={isSubmitting}
                  style={{ padding: '0.875rem', backgroundColor: '#E9F5E3', color: '#2B5B2E', border: '1px solid #C4E2BE' }}
                >
                  {isSubmitting ? 'A entrar...' : 'Entrar'}
                </Button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: '#999' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#eee' }}></div>
                <span style={{ padding: '0 1rem', fontSize: '0.875rem' }}>ou</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#eee' }}></div>
              </div>

              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={handleGoogle}
                style={{ padding: '0.875rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
              >
                Continuar com o Google
              </Button>
            </form>

            <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#555' }}>
              Não tem uma conta? <Link to="/signup" style={{ color: '#0066FF', fontWeight: '500', textDecoration: 'none' }}>Registe-se</Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#666', borderTop: '1px solid #eee' }}>
          <div>© 2026 Crivo</div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => addToast('Termos de serviço em breve.', 'info')} style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', fontSize: 'inherit', cursor: 'pointer', textDecoration: 'none' }}>Termos</button>
            <button onClick={() => addToast('Política de privacidade em breve.', 'info')} style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', fontSize: 'inherit', cursor: 'pointer', textDecoration: 'none' }}>Privacidade</button>
            <button onClick={() => addToast('Para suporte, contacte support@crivo.pt', 'info')} style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', fontSize: 'inherit', cursor: 'pointer', textDecoration: 'none' }}>Suporte</button>
          </div>
        </div>
      </div>
    </div>
  );
}
