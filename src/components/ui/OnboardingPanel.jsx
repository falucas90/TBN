import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, BellRing, X } from 'lucide-react';
import { Btn } from './Primitives';

const STEPS = [
  {
    Icon: Search,
    title: 'Crie uma pesquisa',
    desc: 'Defina marca, modelo, ano, quilómetros e a margem mínima desejada.',
  },
  {
    Icon: Globe,
    title: 'Monitorizamos a Europa',
    desc: 'Acompanhamos os marketplaces (Mobile.de, AutoScout24 e outros) 24/7.',
  },
  {
    Icon: BellRing,
    title: 'Receba alertas com margem',
    desc: 'Quando surge uma viatura rentável, calculamos o ISV e a margem e enviamos-lhe um alerta.',
  },
];

export default function OnboardingPanel({ onCreateSample, onDismiss }) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSample = async () => {
    if (!onCreateSample) return;
    setSubmitting(true);
    try {
      await onCreateSample();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--graphite)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-lg)',
        padding: 24,
        marginBottom: 24,
      }}
    >
      <button
        type="button"
        aria-label="Dispensar introdução"
        onClick={onDismiss}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          padding: 0,
          background: 'transparent',
          border: '1px solid var(--hairline)',
          borderRadius: 8,
          color: 'var(--dust)',
          cursor: 'pointer',
        }}
      >
        <X size={14} />
      </button>

      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--bone)', letterSpacing: '-0.01em' }}>
        Bem-vindo ao Crivo
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--dust)', marginTop: 6, maxWidth: 560 }}>
        Em três passos começa a receber viaturas rentáveis de toda a Europa.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
          margin: '24px 0',
        }}
      >
        {STEPS.map((step, i) => (
          <div key={step.title} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(14,140,106,0.12)',
                  border: '1px solid rgba(14,140,106,0.25)',
                  color: 'var(--emerald)',
                  flexShrink: 0,
                }}
              >
                <step.Icon size={16} strokeWidth={1.75} />
              </span>
              <span style={{ fontSize: 11, color: 'var(--dust)', fontVariantNumeric: 'tabular-nums' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--bone)' }}>{step.title}</div>
            <div style={{ fontSize: 12, color: 'var(--dust)', lineHeight: 1.5 }}>{step.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Btn variant="primary" icon="plus" onClick={() => navigate('/searches/new')}>
          Criar primeira pesquisa
        </Btn>
        {onCreateSample && (
          <Btn variant="ghost" onClick={handleSample} disabled={submitting}>
            {submitting ? 'A criar…' : 'Criar pesquisa de exemplo'}
          </Btn>
        )}
      </div>
    </div>
  );
}
