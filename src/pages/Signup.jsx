import { useState } from 'react';
import { Badge, Button, StepIndicator } from '../components/ui';
import { BrandLockup } from '../components/ui/Logo';
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

// Mock formatting for the placeholder payment inputs (to be replaced by Stripe Elements)
function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
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
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateStep1 = () => {
    if (!nome.trim() || !apelido.trim()) { setError('Preencha o nome e apelido.'); return false; }
    if (!email.includes('@') || !email.includes('.')) { setError('Introduza um email válido.'); return false; }
    if (password.length < 6) { setError('A palavra-passe deve ter pelo menos 6 caracteres.'); return false; }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!company.trim()) { setError('Introduza o nome da empresa.'); return false; }
    const nifDigits = nif.replace(/\s/g, '');
    if (!/^\d{9}$/.test(nifDigits)) { setError('O NIF deve ter exatamente 9 dígitos.'); return false; }
    setError('');
    return true;
  };

  const handleSignup = async () => {
    if (!validateStep2()) return;
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--obsidian)' }}>
      {/* Left brand panel */}
      <div style={{ flex: 1, background: 'var(--emerald)', color: '#fff', padding: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ marginBottom: 16 }}><BrandLockup markSize={36} wordSize={22} /></div>
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
                  {error && <p style={{ color: 'var(--coral)', fontSize: 13, margin: 0 }}>{error}</p>}
                  <Button variant="primary" fullWidth onClick={() => { if (validateStep1()) setStep(2); }}>Continuar</Button>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <FormField label="Nome da Empresa" required>
                    <input type="text" className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </FormField>

                  {/* Pagamento — mock inputs until Stripe Elements are wired in */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="eyebrow">Pagamento</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', background: 'var(--slate)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)' }}>
                    <div>
                      <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Plano Pro</div>
                      <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--dust)' }}>
                        <span className="mono" style={{ fontWeight: 500 }}>€ 49</span>/mês
                      </div>
                    </div>
                    <Badge variant="success">14 dias grátis</Badge>
                  </div>

                  <FormField label="Número do cartão">
                    <input
                      type="text"
                      className="input mono"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    />
                  </FormField>
                  <div className="form-grid-2">
                    <FormField label="Validade">
                      <input
                        type="text"
                        className="input mono"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      />
                    </FormField>
                    <FormField label="CVC">
                      <input
                        type="text"
                        className="input mono"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      />
                    </FormField>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--dust)', margin: 0 }}>🔒 Pagamento seguro processado pela Stripe</p>

                  <FormField label="NIF" required>
                    <>
                      <input type="text" className="input" value={nif} onChange={(e) => setNif(e.target.value)} />
                      <span className="field__hint">Para faturação</span>
                    </>
                  </FormField>

                  <p style={{ fontSize: 13, color: 'var(--ash)', margin: 0 }}>Só será cobrado após os 14 dias.</p>
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
                  <p style={{ color: 'var(--dust)', marginBottom: 32 }}>Conta criada! Faça login para entrar no painel.</p>
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
