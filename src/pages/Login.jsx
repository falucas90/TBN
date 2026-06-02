import React, { useState } from 'react';
import { Button } from '../components/ui';
import { FormField } from '../components/forms';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const success = login(email, password);
    if (success) {
      navigate('/searches');
    } else {
      setError('Credenciais inválidas');
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
          <div style={{ width: '100%', maxWidth: '380px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Bem-vindo de volta</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2.5rem' }}>Aceda à sua conta</p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <FormField label="Email" required>
                <input
                  type="email"
                  placeholder="stand@exemplo.pt"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none', width: '100%' }}
                />
              </FormField>
              <FormField label="Palavra-passe" required>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '12px', fontSize: '0.875rem', color: '#666', cursor: 'pointer' }}>show</span>
                </div>
                <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                  <a href="#" style={{ color: '#0066FF', fontSize: '0.875rem', textDecoration: 'none' }}>Esqueceu-se da palavra-passe?</a>
                </div>
              </FormField>

              {error && (
                <p style={{ color: 'var(--color-danger-text)', fontSize: '0.875rem', margin: 0 }}>{error}</p>
              )}

              <div style={{ marginTop: '0.5rem' }}>
                <Button type="submit" fullWidth style={{ padding: '0.875rem', backgroundColor: '#E9F5E3', color: '#2B5B2E', border: '1px solid #C4E2BE' }}>Entrar</Button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: '#999' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#eee' }}></div>
                <span style={{ padding: '0 1rem', fontSize: '0.875rem' }}>ou</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#eee' }}></div>
              </div>

              <Button type="button" variant="secondary" fullWidth style={{ padding: '0.875rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                Continuar com o Google
              </Button>
            </form>

            <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#555' }}>
              Não tem uma conta? <a href="/signup" style={{ color: '#0066FF', fontWeight: '500', textDecoration: 'none' }}>Registe-se</a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#666', borderTop: '1px solid #eee' }}>
          <div>© 2026 Crivo</div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Termos</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidade</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Suporte</a>
          </div>
        </div>
      </div>
    </div>
  );
}
