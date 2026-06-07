import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Callout } from '../components/ui';
import { FormField } from '../components/forms';
import { sendPasswordResetEmail } from '../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(email);
    } catch {
      // Always show success regardless — don't reveal if email exists
    } finally {
      setEmail('');
      setSubmitted(true);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{
          border: '1px solid #D6D5D1', padding: '0.6rem 2rem', borderRadius: '6px',
          display: 'inline-block', fontWeight: '700', fontSize: '1rem',
          backgroundColor: '#fff', marginBottom: '2rem'
        }}>
          CRIVO
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Recuperar palavra-passe
        </h2>
        <p style={{ color: 'var(--ash)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Introduza o seu email e enviaremos um link de recuperação.
        </p>

        {submitted ? (
          <Callout variant="success" title="Email enviado">
            Verifique a sua caixa de entrada.
          </Callout>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <FormField label="Email" required>
              <input
                type="email"
                placeholder="stand@exemplo.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  padding: '0.75rem', borderRadius: 'var(--r-md)',
                  border: '1px solid var(--hairline)', outline: 'none', width: '100%'
                }}
              />
            </FormField>

            <Button
              type="submit"
              fullWidth
              disabled={!email || isSubmitting}
              style={{ padding: '0.875rem' }}
            >
              {isSubmitting ? 'A enviar...' : 'Enviar link'}
            </Button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <Link to="/login" style={{ color: 'var(--ash)', fontSize: '0.875rem', textDecoration: 'none' }}>
            ← Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
