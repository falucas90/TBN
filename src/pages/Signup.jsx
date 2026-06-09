import React, { useState } from 'react';
import { Card, Button, StepIndicator } from '../components/ui';
import { FormField } from '../components/forms';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabaseConfigured } from '../lib/supabase';

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
      if (!supabaseConfigured) {
        setStep(3);
        return;
      }
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
    <div style={{ display: 'flex', height: '100vh', background: 'var(--obsidian)' }}>
      {/* Left brand panel */}
      <div style={{ flex: 1, background: 'var(--emerald)', color: '#fff', padding: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 600, marginBottom: 16, letterSpacing: 'var(--tracking-tighter)' }}>Crivo</h1>
        <p style={{ fontSize: 'var(--fs-lg)', opacity: 0.9, maxWidth: 400, marginBottom: 32, lineHeight: 'var(--lh-body)' }}>
          Acelere hoje o seu processo de sourcing de inventário.
        </p>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, opacity: 0.9, fontSize: 'var(--fs-body)', padding: 0, margin: 0 }}>
          <li>✓ Calcule o ISV automaticamente</li>
          <li>✓ Pesquise em mais de 5 plataformas europeias</li>
          <li>✓ Acompanhe as margens esperadas em tempo real</li>
        </ul>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div className="card">
            <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <StepIndicator currentStep={step} steps={[1, 2, 3]} />

              <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)' }}>
                {step === 1 && 'Crie a sua conta'}
                {step === 2 && 'Detalhes da empresa'}
                {step === 3 && 'Tudo pronto!'}
              </h2>

              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-grid-2">
                    <FormField label="Nome" required>
                      <input type="text" className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
                    </FormField>
                    <FormField label="Apelido" required>
                      <input type="text" className="input" value={apelido} onChange={(e) => setApelido(e.target.value)} />
                    </FormField>
                  </div>
                  <FormField label="Email" required>
                    <input type="email" className="input" placeholder="stand@exemplo.pt" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </FormField>
                  <FormField label="Palavra-passe" required>
                    <input type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </FormField>
                  <Button variant="primary" fullWidth onClick={() => setStep(2)}>Continuar</Button>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <FormField label="Nome da Empresa" required>
                    <input type="text" className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </FormField>
                  <FormField label="NIF" required>
                    <input type="text" className="input" value={nif} onChange={(e) => setNif(e.target.value)} />
                  </FormField>
                  {error && <p style={{ color: 'var(--coral)', fontSize: 13, margin: 0 }}>{error}</p>}
                  <Button variant="primary" fullWidth onClick={handleSignup} disabled={isSubmitting}>
                    {isSubmitting ? 'A registar...' : 'Concluir Registo'}
                  </Button>
                  <Button fullWidth variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
                </div>
              )}

              {step === 3 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, background: 'var(--emerald-12)', color: 'var(--emerald)', borderRadius: 'var(--r-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 20 }}>✓</div>
                  <p style={{ color: 'var(--dust)', marginBottom: 32 }}>A redirecionar para o painel principal...</p>
                  <Link to="/login"><Button variant="primary">Ir para o Login</Button></Link>
                </div>
              )}

              {step === 1 && (
                <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--dust)' }}>
                  <Link to="/login">Já tem uma conta? <span style={{ color: 'var(--emerald)', fontWeight: 500 }}>Entrar</span></Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
