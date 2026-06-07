import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Btn, Icon, Switch } from '../components/ui/Primitives';

export default function CreateSearch() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState({ whatsapp: true, email: false, sms: false });
  const [dailySummary, setDailySummary] = useState(true);
  
  const [countries, setCountries] = useState({
    germany: true, france: false, netherlands: false, belgium: false, spain: false
  });

  const handleLaunch = () => {
    navigate('/searches');
  };

  return (
    <div className="page">
      <div className="page__top">
        <div>
          <h1 className="page__title">Criar Nova Pesquisa</h1>
          <p className="page__sub">Configure os critérios, origens e limites de alerta.</p>
        </div>
        <div className="row gap-3">
          <Btn variant="ghost" onClick={handleLaunch}>Guardar Rascunho</Btn>
          <Btn variant="primary" onClick={handleLaunch}>Iniciar Pesquisa</Btn>
        </div>
      </div>

      <div className="page__body" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(500px, 1fr) 350px', gap: '32px', alignItems: 'start' }}>
          
          <div className="stack gap-6">
            <div className="card">
              <div className="card__body stack gap-5">
                <h2 style={{ fontSize: '15px', fontWeight: '600' }}>1. Critérios do Veículo</h2>
                
                <div className="form-grid-2">
                  <div className="field">
                    <label className="field__label">Marca</label>
                    <select className="select">
                      <option>BMW</option>
                      <option>Renault</option>
                      <option>Mercedes-Benz</option>
                      <option>Audi</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field__label">Modelo</label>
                    <select className="select">
                      <option>Série 3</option>
                      <option>Classe A</option>
                      <option>Megane</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="field">
                    <label className="field__label">Ano</label>
                    <div className="row gap-2">
                      <input type="number" className="input" defaultValue="2018" placeholder="Mín" />
                      <span className="muted">—</span>
                      <input type="number" className="input" defaultValue="2024" placeholder="Máx" />
                    </div>
                  </div>
                  <div className="field">
                    <label className="field__label">Quilómetros (KMs)</label>
                    <div className="row gap-2">
                      <input type="number" className="input" defaultValue="0" placeholder="Mín" />
                      <span className="muted">—</span>
                      <input type="number" className="input" defaultValue="100000" placeholder="Máx" />
                    </div>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="field">
                    <label className="field__label">Preço (€)</label>
                    <div className="row gap-2">
                      <input type="number" className="input" defaultValue="0" placeholder="Mín" />
                      <span className="muted">—</span>
                      <input type="number" className="input" defaultValue="30000" placeholder="Máx" />
                    </div>
                  </div>
                  <div className="field">
                    <label className="field__label">Combustível</label>
                    <select className="select">
                      <option>Todos</option>
                      <option>Diesel</option>
                      <option>Gasolina</option>
                      <option>Híbrido (PHEV)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__body stack gap-4">
                <h2 style={{ fontSize: '15px', fontWeight: '600' }}>2. Países de Origem</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  {Object.entries({
                    germany: 'Alemanha', france: 'França', netherlands: 'Holanda', belgium: 'Bélgica', spain: 'Espanha'
                  }).map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={countries[key]} 
                        onChange={(e) => setCountries(c => ({...c, [key]: e.target.checked}))} 
                        style={{ width: '16px', height: '16px', accentColor: 'var(--emerald)' }}
                      />
                      <span style={{ fontSize: '13px', color: 'var(--bone)' }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__body stack gap-5">
                <h2 style={{ fontSize: '15px', fontWeight: '600' }}>3. Margem e Notificações</h2>
                <div className="form-grid-2">
                  <div className="field">
                    <label className="field__label">Margem Mínima Esperada (€)</label>
                    <input type="number" className="input" defaultValue="2500" />
                  </div>
                  <div className="field">
                    <label className="field__label">Disparar Alerta a partir de (€)</label>
                    <input type="number" className="input" defaultValue="3000" />
                  </div>
                </div>
                
                <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: '20px' }}>
                  <div className="field">
                    <label className="field__label" style={{ marginBottom: '8px' }}>Canais de Alerta Instantâneo</label>
                    <div className="row gap-5">
                      <label className="row gap-2" style={{ cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={alerts.whatsapp} onChange={e => setAlerts(a => ({...a, whatsapp: e.target.checked}))} style={{ accentColor: 'var(--emerald)' }}/> WhatsApp
                      </label>
                      <label className="row gap-2" style={{ cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={alerts.email} onChange={e => setAlerts(a => ({...a, email: e.target.checked}))} style={{ accentColor: 'var(--emerald)' }}/> Email
                      </label>
                    </div>
                  </div>
                </div>

                <div className="row" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--hairline)', paddingTop: '20px' }}>
                  <div className="stack gap-1">
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Resumo Diário</span>
                    <span className="muted" style={{ fontSize: '12px' }}>Enviar email todos os dias de manhã</span>
                  </div>
                  <Switch checked={dailySummary} onChange={setDailySummary} />
                </div>
              </div>
            </div>

          </div>

          <div style={{ position: 'sticky', top: '28px' }}>
            <div className="card" style={{ background: 'transparent', border: '1px solid var(--hairline)' }}>
              <div className="card__body stack gap-4">
                <h3 style={{ fontSize: '15px', fontWeight: '600' }}>Audiência Estimada</h3>
                <p style={{ color: 'var(--ash)', fontSize: '13px' }}>
                  Anúncios correspondentes antes de aplicar os cálculos de rentabilidade:
                </p>
                <div className="stack gap-1">
                  <span style={{ fontSize: '32px', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--bone)' }}>48</span>
                  <span className="muted" style={{ fontSize: '12px' }}>veículos totais na Europa</span>
                </div>
                <div className="stack gap-2" style={{ marginTop: '12px', borderTop: '1px solid var(--hairline)', paddingTop: '16px' }}>
                  <div className="row" style={{ justifyContent: 'space-between', fontSize: '13px' }}>
                    <span className="muted">Alemanha</span>
                    <span className="bone" style={{ fontWeight: 500 }}>32</span>
                  </div>
                  <div className="row" style={{ justifyContent: 'space-between', fontSize: '13px' }}>
                    <span className="muted">França</span>
                    <span className="bone" style={{ fontWeight: 500 }}>16</span>
                  </div>
                </div>
                <Btn variant="primary" size="lg" style={{ width: '100%', marginTop: '16px' }} onClick={handleLaunch}>
                  Iniciar Pesquisa <Icon name="arrow" color="#FFF" />
                </Btn>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
