import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wordmark, SieveMark, Btn, Icon } from '../components/ui/Primitives';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);

  const handleLogin = e => {
    e.preventDefault();
    login();
    navigate('/searches');
  };

  return (
    <div className="login-shell">
      <div className="login-left">
        <div>
          <div className="login__brand" style={{ alignItems: 'flex-start' }}>
            <Wordmark size={28} />
          </div>
          <h1 style={{ fontSize: '32px', letterSpacing: '-0.03em', lineHeight: 1.15, marginTop: '40px', marginBottom: '24px', maxWidth: '400px' }}>
            Inteligência de sourcing para stands portugueses.
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--ash)', lineHeight: 1.6, maxWidth: '360px' }}>
            Monitorize anúncios europeus. Obtenha cálculos de ISV automáticos. Receba alertas pelo WhatsApp quando a rentabilidade for certa.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '40px' }}>
          <div className="stack gap-1">
            <span style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--bone)' }}>110k+</span>
            <span style={{ fontSize: '12px', color: 'var(--dust)' }}>carros<br/>importados/ano</span>
          </div>
          <div className="stack gap-1">
            <span style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--bone)' }}>±5%</span>
            <span style={{ fontSize: '12px', color: 'var(--dust)' }}>precisão<br/>de ISV</span>
          </div>
          <div className="stack gap-1">
            <span style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--bone)' }}>€99</span>
            <span style={{ fontSize: '12px', color: 'var(--dust)' }}>/mês, cancele<br/>quando quiser</span>
          </div>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login__card">
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h2 className="login__word">Bem-vindo de volta</h2>
            <p className="login__tag">Aceda à sua conta Crivo</p>
          </div>
          
          <form onSubmit={handleLogin} className="stack gap-4">
            <div className="field">
              <label className="field__label">Email</label>
              <input type="email" className="input" placeholder="stand@exemplo.pt" />
            </div>
            
            <div className="field">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <label className="field__label">Palavra-passe</label>
                <a href="#" style={{ fontSize: '11px', color: 'var(--emerald)' }}>Esqueceu-se?</a>
              </div>
              <div className="input-group">
                <input type={showPass ? 'text' : 'password'} className="input" placeholder="••••••••" style={{ paddingLeft: '12px', paddingRight: '36px' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ash)' }}>
                  {showPass ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
            
            <Btn variant="primary" size="lg" style={{ width: '100%', marginTop: '8px' }}>
              Entrar <Icon name="arrow" size={14} color="#FFF" />
            </Btn>
            
            <div className="login__divider">ou</div>
            
            <Btn variant="ghost" size="lg" style={{ width: '100%', background: 'var(--graphite)', border: '1px solid var(--hairline)' }}>
              Continuar com o Google
            </Btn>
          </form>
          
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ash)', marginTop: '24px' }}>
            Não tem conta? <a href="/signup" style={{ color: 'var(--bone)', fontWeight: 500, borderBottom: '1px solid var(--hairline)' }}>Registe-se</a>
          </p>
        </div>
      </div>
    </div>
  );
}
