import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Callout } from '../components/ui';
import { FormField } from '../components/forms';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { updatePassword } from '../services/authService';
import { BrandLockup } from '../components/ui/Logo';

export default function ResetPassword() {
  const navigate = useNavigate();
  // 'checking' | 'valid' | 'invalid' | 'success'
  const [status, setStatus] = useState('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const hasToken =
      params.has('code') ||
      hash.includes('access_token') ||
      hash.includes('type=recovery');

    if (!hasToken) {
      setStatus('invalid');
      return;
    }

    if (!supabaseConfigured) {
      setStatus('invalid');
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('valid');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    setError('');
    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setStatus('success');
    } catch {
      setError('Ocorreu um erro ao redefinir a palavra-passe. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mismatch = !!confirmPassword && password !== confirmPassword;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--obsidian)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <BrandLockup markSize={28} wordSize={16} />
        </div>

        {status === 'checking' && (
          <p style={{ color: 'var(--ash)' }}>A verificar...</p>
        )}

        {status === 'invalid' && (
          <>
            <Callout variant="danger" title="Link expirado ou inválido">
              Este link de recuperação já não é válido. Peça um novo link para continuar.
            </Callout>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Button fullWidth onClick={() => navigate('/forgot-password')}>
                Pedir novo link
              </Button>
              <Link to="/login" style={{ color: 'var(--ash)', fontSize: '0.875rem', textDecoration: 'none' }}>
                ← Voltar ao login
              </Link>
            </div>
          </>
        )}

        {status === 'valid' && (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem' }}>
              Definir nova palavra-passe
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <FormField label="Nova palavra-passe" required>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    padding: '0.75rem', borderRadius: 'var(--r-md)',
                    border: '1px solid var(--hairline)', outline: 'none', width: '100%'
                  }}
                />
              </FormField>
              <FormField label="Confirmar palavra-passe" required>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    padding: '0.75rem', borderRadius: 'var(--r-md)',
                    border: '1px solid var(--hairline)', outline: 'none', width: '100%'
                  }}
                />
                {mismatch && (
                  <p style={{ color: 'var(--coral)', fontSize: '0.8125rem', marginTop: '0.25rem', margin: '0.25rem 0 0' }}>
                    As palavras-passe não coincidem.
                  </p>
                )}
              </FormField>
              {error && (
                <p style={{ color: 'var(--coral)', fontSize: '0.875rem', margin: 0 }}>{error}</p>
              )}
              <Button
                type="submit"
                fullWidth
                disabled={!password || !confirmPassword || mismatch || isSubmitting}
                style={{ padding: '0.875rem' }}
              >
                {isSubmitting ? 'A redefinir...' : 'Redefinir palavra-passe'}
              </Button>
            </form>
          </>
        )}

        {status === 'success' && (
          <Callout variant="success" title="Palavra-passe redefinida">
            A sua palavra-passe foi atualizada com sucesso.{' '}
            <Link to="/login" style={{ color: 'var(--emerald)', fontWeight: '600' }}>
              Iniciar sessão
            </Link>
          </Callout>
        )}
      </div>
    </div>
  );
}
