import React, { useState } from 'react';
import { Wordmark, Btn, Icon } from '../components/ui/Primitives';

function StepIndicator({ currentStep, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', width: '100%' }}>
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <React.Fragment key={step}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '26px', height: '26px', borderRadius: '50%',
              fontSize: '11px', fontWeight: '600', flexShrink: 0,
              background: isCompleted ? 'var(--emerald)' : isActive ? 'var(--emerald-12)' : 'var(--slate)',
              color: isCompleted ? '#FFFFFF' : isActive ? 'var(--emerald)' : 'var(--ash)',
              border: isActive ? '2px solid var(--emerald)' : '2px solid transparent',
              transition: 'all var(--t-base)',
            }}>
              {isCompleted ? <Icon name="check" size={14} strokeWidth={3} /> : stepNum}
            </div>
            {idx < steps.length - 1 && (
              <div style={{
                flex: 1, height: '2px', minWidth: '24px',
                background: isCompleted ? 'var(--emerald)' : 'var(--hairline)',
                transition: 'background var(--t-slow)',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function Signup() {
  const [step, setStep] = useState(1);

  const features = [
    'Calcule o ISV automaticamente',
    'Pesquise em mais de 5 plataformas europeias',
    'Acompanhe margens esperadas em tempo real',
    'Alertas instantâneos no WhatsApp',
  ];

  return (
    <div className="login-shell">

      {/* Left panel */}
      <div className="login-left" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', bottom: '-120px', right: '-120px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, var(--emerald-12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="login__brand" style={{ alignItems: 'flex-start' }}>
          <Wordmark size={24} />
        </div>

        <div style={{ zIndex: 1 }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.25rem)', fontWeight: '500', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '24px' }}>
            Acelere o seu processo de sourcing.
          </h1>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px', padding: 0 }}>
            {features.map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', color: 'var(--ash)', lineHeight: 1.4 }}>
                <span style={{
                  color: 'var(--emerald)', marginTop: '2px',
                  background: 'var(--emerald-12)', borderRadius: '50%',
                  width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon name="check" size={12} strokeWidth={2.5} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--dust)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          © 2026 Crivo · Lisboa
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login__card">
          <div style={{ marginBottom: '32px' }}>
            <StepIndicator currentStep={step} steps={[1, 2, 3]} />
          </div>

          <h2 className="login__word" style={{ textAlign: 'center', marginBottom: '24px' }}>
            {step === 1 && 'Crie a sua conta'}
            {step === 2 && 'Detalhes da empresa'}
            {step === 3 && 'Tudo pronto!'}
          </h2>

          {step === 1 && (
            <div className="stack gap-4">
              <div className="form-grid-2">
                <div className="field"><label className="field__label">Nome</label><input type="text" className="input" /></div>
                <div className="field"><label className="field__label">Apelido</label><input type="text" className="input" /></div>
              </div>
              <div className="field"><label className="field__label">Email</label><input type="email" placeholder="stand@exemplo.pt" className="input" /></div>
              <div className="field"><label className="field__label">Palavra-passe</label><input type="password" placeholder="••••••••" className="input" /></div>
              
              <div style={{ marginTop: '8px' }}>
                <Btn variant="primary" size="lg" style={{ width: '100%' }} onClick={() => setStep(2)}>
                  Continuar <Icon name="arrow" color="#FFF" />
                </Btn>
              </div>
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ash)', marginTop: '8px' }}>
                Já tem conta? <a href="/login" style={{ color: 'var(--bone)', fontWeight: 500, borderBottom: '1px solid var(--hairline)' }}>Entrar</a>
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="stack gap-4">
              <div className="field"><label className="field__label">Nome da Empresa</label><input type="text" className="input" /></div>
              <div className="field"><label className="field__label">NIF</label><input type="text" className="input" /></div>
              
              <div className="stack gap-2" style={{ marginTop: '8px' }}>
                <Btn variant="primary" size="lg" style={{ width: '100%' }} onClick={() => setStep(3)}>
                  Concluir Registo <Icon name="check" color="#FFF" />
                </Btn>
                <Btn variant="ghost" size="lg" style={{ width: '100%' }} onClick={() => setStep(1)}>
                  Voltar
                </Btn>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px',
                background: 'var(--emerald-12)', color: 'var(--emerald)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <Icon name="check" size={24} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>Conta criada!</h3>
              <p style={{ color: 'var(--dust)', fontSize: '14px', marginBottom: '32px' }}>
                Pronto para começar a filtrar oportunidades.
              </p>
              <a href="/login" style={{ textDecoration: 'none', display: 'block' }}>
                <Btn variant="primary" size="lg" style={{ width: '100%' }}>
                  Ir para o Login <Icon name="arrow" color="#FFF" />
                </Btn>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
