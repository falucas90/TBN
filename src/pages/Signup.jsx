import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SieveMark, Wordmark } from '../components/ui/Logo';
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
  const [nome, setNome] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [nif, setNif] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    if (!nome.trim()) { setError('Introduza o seu nome.'); return false; }
    if (!company.trim()) { setError('Introduza o nome do stand / empresa.'); return false; }
    if (!email.includes('@') || !email.includes('.')) { setError('Introduza um email válido.'); return false; }
    if (password.length < 8) { setError('A palavra-passe deve ter pelo menos 8 caracteres.'); return false; }
    const nifDigits = nif.replace(/\s/g, '');
    if (nifDigits && !/^\d{9}$/.test(nifDigits)) { setError('O NIF deve ter exatamente 9 dígitos.'); return false; }
    setError('');
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (!supabaseConfigured) {
        navigate('/dashboard');
        return;
      }
      await signup(email, password, {
        full_name: nome.trim(),
        company: company.trim(),
        nif: nif.replace(/\s/g, ''),
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
    <div className="app-login">
      <div className="login grain">
        <div className="login__brand">
          <SieveMark size={48} color="var(--bone)" strokeWidth={1} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Wordmark size={22} />
            <span className="login__tag">Cria a tua conta. Primeira pesquisa em 2 minutos.</span>
          </div>
        </div>
        <form className="login__card" onSubmit={handleSignup}>
          <div className="field">
            <label className="field__label" htmlFor="su-nome">Nome</label>
            <input id="su-nome" className="input" type="text" placeholder="João Marques" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="su-company">Stand / Empresa</label>
            <input id="su-company" className="input" type="text" placeholder="Stand Marques, Lda." value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="su-email">Email</label>
            <input id="su-email" className="input" type="email" placeholder="joao@standmarques.pt" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="su-password">Palavra-passe</label>
            <input id="su-password" className="input" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="login__divider">Pagamento</div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', background: 'var(--graphite)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>Plano Pro</span>
              <span style={{ fontSize: 11.5, color: 'var(--dust)' }}>Pesquisas ilimitadas · Alertas WhatsApp · ISV</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span className="tnum" style={{ fontSize: 14, fontWeight: 600 }}>€ 49<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--dust)' }}>/mês</span></span>
              <span style={{ fontSize: 10.5, color: 'var(--emerald)', fontWeight: 500 }}>14 dias grátis</span>
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="su-card">Número do cartão</label>
            <input id="su-card" className="input tnum" type="text" inputMode="numeric" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label className="field__label" htmlFor="su-expiry">Validade</label>
              <input id="su-expiry" className="input tnum" type="text" inputMode="numeric" placeholder="MM / AA" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="field__label" htmlFor="su-cvc">CVC</label>
              <input id="su-cvc" className="input tnum" type="text" inputMode="numeric" placeholder="123" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="su-nif">NIF (para fatura)</label>
            <input id="su-nif" className="input tnum" type="text" inputMode="numeric" placeholder="500 123 456" value={nif} onChange={(e) => setNif(e.target.value)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'var(--dust)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span>Pagamento seguro processado pela <strong style={{ color: 'var(--ash)', fontWeight: 500 }}>Stripe</strong></span>
          </div>

          {error && <p style={{ color: 'var(--coral)', fontSize: 13, margin: 0, textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%', marginTop: 6 }} disabled={isSubmitting}>
            {isSubmitting ? 'A registar…' : 'Criar conta'}
          </button>
          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--dust)', marginTop: 16 }}>
            Só será cobrado após os 14 dias. Ao criar conta aceita os Termos e a Política de Privacidade.
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ash)', marginTop: 4 }}>
            Já tem conta?{' '}
            <Link to="/login" style={{ color: 'var(--emerald)', fontWeight: 500 }}>Entrar</Link>
          </div>
        </form>
        <div className="login__footnote">v1.0 · Lisboa</div>
      </div>
    </div>
  );
}
