import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { resendVerificationEmail } from '../services/authService';

const COOLDOWN_SECONDS = 60;

export default function VerifyEmail() {
  const { currentUser } = useAuth();
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    setIsResending(true);
    setResendSuccess(false);
    try {
      if (currentUser?.email) await resendVerificationEmail(currentUser.email);
      setResendSuccess(true);
    } catch {
      setResendSuccess(true); // show success regardless — don't reveal failures
    } finally {
      setIsResending(false);
      setCooldown(COOLDOWN_SECONDS);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--obsidian)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
        <div style={{
          border: '1px solid var(--hairline)', padding: '0.6rem 2rem', borderRadius: 'var(--r-md)',
          display: 'inline-block', fontWeight: 600, fontSize: 'var(--fs-md)', letterSpacing: '0.05em',
          background: 'var(--graphite)', marginBottom: '2rem'
        }}>
          CRIVO
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Mail size={48} color="var(--emerald)" strokeWidth={1.5} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Verifique o seu email
        </h2>
        <p style={{ color: 'var(--ash)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
          Enviamos um link de confirmação para:
        </p>
        {currentUser?.email && (
          <p style={{ fontWeight: '600', color: 'var(--bone)', marginBottom: '0.75rem' }}>
            {currentUser.email}
          </p>
        )}
        <p style={{ color: 'var(--ash)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Clique no link para ativar a sua conta.
        </p>

        {resendSuccess && (
          <p style={{ color: 'var(--emerald)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Email reenviado com sucesso.
          </p>
        )}

        <Button
          variant="secondary"
          fullWidth
          onClick={handleResend}
          disabled={cooldown > 0 || isResending}
          style={{ padding: '0.875rem', marginBottom: '0.75rem' }}
        >
          {isResending ? 'A reenviar...' : 'Reenviar email'}
        </Button>

        {cooldown > 0 && (
          <p style={{ color: 'var(--dust)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            Reenviar disponível em {cooldown}s
          </p>
        )}

        <div style={{ marginTop: '1rem' }}>
          <Link to="/login" style={{ color: 'var(--ash)', fontSize: '0.875rem', textDecoration: 'none' }}>
            ← Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
