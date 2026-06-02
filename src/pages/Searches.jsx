import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SieveMark, Btn, Icon, Pill, Dot } from '../components/ui/Primitives';

const mockSearches = [
  { id: 1, name: 'Volvo XC90 PHEV', status: 'active', found: 12, new: 3, budget: '€45k - €55k', isvStr: '€2.1k - €3.5k', since: 'Há 2 dias' },
  { id: 2, name: 'BMW 330e Touring', status: 'active', found: 45, new: 12, budget: '€30k - €40k', isvStr: '€1.8k - €2.5k', since: 'Há 1 sem' },
  { id: 3, name: 'Tesla Model 3 LR', status: 'paused', found: 89, new: 0, budget: 'Até €35k', isvStr: 'Isento', since: 'Há 2 sem' }
];

export default function Searches() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="page__top">
        <div>
          <h1 className="page__title">Pesquisas Ativas</h1>
          <p className="page__sub">Monitorizar plataformas europeias</p>
        </div>
        <Btn variant="primary" onClick={() => navigate('/searches/new')} icon="plus">
          Nova Pesquisa
        </Btn>
      </div>

      <div className="page__body">
        {mockSearches.length > 0 ? (
          <div className="searches-grid">
            {mockSearches.map(s => (
              <div key={s.id} className="search-card" onClick={() => navigate(`/searches/${s.id}`)}>
                <div className="search-card__head">
                  <div>
                    <h3 className="search-card__name">{s.name}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--dust)', marginTop: '4px' }}>
                      {s.budget} · {s.since}
                    </p>
                  </div>
                  {s.status === 'active' ? (
                    <Pill tone="emerald"><Dot tone="emerald" /> Ativa</Pill>
                  ) : (
                    <Pill><Dot /> Pausada</Pill>
                  )}
                </div>
                
                <div className="search-card__stats">
                  <div className="num-pair">
                    <span className="num-pair__label">Total</span>
                    <span className="num-pair__value">{s.found}</span>
                  </div>
                  <div className="num-pair">
                    <span className="num-pair__label">Novos</span>
                    <span className={`num-pair__value ${s.new > 0 ? 'emerald' : ''}`}>{s.new > 0 ? `+${s.new}` : '0'}</span>
                  </div>
                  <div className="num-pair">
                    <span className="num-pair__label">Est. ISV</span>
                    <span className="num-pair__value" style={{ fontSize: '13px' }}>{s.isvStr}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--graphite)', border: '1px dashed var(--hairline-strong)', borderRadius: 'var(--r-lg)' }}>
            <SieveMark size={40} color="var(--hairline-strong)" />
            <h3 style={{ fontSize: '16px', color: 'var(--bone)', marginTop: '16px', marginBottom: '8px' }}>Nenhuma pesquisa ativa</h3>
            <p style={{ fontSize: '13px', color: 'var(--ash)', maxWidth: '300px', margin: '0 auto 24px' }}>
              Crie a sua primeira pesquisa para começar a receber veículos importáveis com margem calculada.
            </p>
            <Btn variant="primary" onClick={() => navigate('/searches/new')} icon="plus">
              Nova Pesquisa
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
