import React, { useState } from 'react';
import { Card, Button, StepIndicator } from '../components/ui';
import { FormField } from '../components/forms';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function mapSignupError(error) {
  const msg = error?.message?.toLowerCase() || '';
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'Este email já está registado.';
  }
  if (msg.includes('password should be at least')) {
    return 'A palavra-passe deve ter pelo menos 6 caracteres.';
  }
  if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
    return 'Email inválido.';
  }
  return 'Ocorreu um erro no registo. Tente novamente.';
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [nif, setNif] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await signup(email, password, {
        full_name: `${nome} ${apelido}`.trim(),
        company,
        nif,
        role: 'dealer',
      });
      navigate('/verify-email');
    } catch (err) {
      setError(mapSignupError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--color-bg-page)' }}>
      <div style={{ flex: 1, backgroundColor: 'var(--color-primary-teal)', color: '#fff', padding: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem' }}>Crivo</h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '400px', marginBottom: '2rem' }}>
          Acelere hoje o seu processo de sourcing de inventário.
        </p>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.9 }}>
           <li>✓ Calcule o ISV automaticamente</li>
           <li>✓ Pesquise em mais de 5 plataformas europeias</li>
           <li>✓ Acompanhe as margens esperadas em tempo real</li>
        </ul>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <Card style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <StepIndicator currentStep={step} steps={[1, 2, 3]} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem' }}>
            {step === 1 && "Crie a sua conta"}
            {step === 2 && "Detalhes da empresa"}
            {step === 3 && "Tudo pronto!"}
          </h2>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label="Nome" required>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }}
                  />
                </FormField>
                <FormField label="Apelido" required>
                  <input
                    type="text"
                    value={apelido}
                    onChange={(e) => setApelido(e.target.value)}
                    style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }}
                  />
                </FormField>
              </div>
              <FormField label="Email" required>
                <input
                  type="email"
                  placeholder="stand@exemplo.pt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }}
                />
              </FormField>
              <FormField label="Palavra-passe" required>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }}
                />
              </FormField>
              <Button fullWidth onClick={() => setStep(2)} style={{ marginTop: '1rem' }}>Continuar</Button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FormField label="Nome da Empresa" required>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }}
                />
              </FormField>
              <FormField label="NIF" required>
                <input
                  type="text"
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }}
                />
              </FormField>
              {error && (
                <p style={{ color: 'var(--color-danger-text)', fontSize: '0.875rem', margin: 0 }}>{error}</p>
              )}
              <Button
                fullWidth
                onClick={handleSignup}
                disabled={isSubmitting}
                style={{ marginTop: '1rem' }}
              >
                {isSubmitting ? 'A registar...' : 'Concluir Registo'}
              </Button>
              <Button fullWidth variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize:'1.5rem' }}>✓</div>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>A redirecionar para o painel principal...</p>
              <Link to="/login"><Button>Ir para o Login</Button></Link>
            </div>
          )}

          {step === 1 && (
            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
              <Link to="/login" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Já tem uma conta? <span style={{ color: 'var(--color-primary-teal)', fontWeight: '600' }}>Entrar</span></Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
