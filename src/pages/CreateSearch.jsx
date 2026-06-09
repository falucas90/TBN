import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Btn, Icon, Switch } from '../components/ui/Primitives';
import { useToast } from '../context/ToastContext';
import { createSearch, updateSearch, getSearchById } from '../services/searchesService';

const BRANDS = ['BMW', 'Renault', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Volvo'];
const MODELS = {
  BMW: ['Série 1', 'Série 3', 'Série 5', 'X3', 'X5'],
  Renault: ['Clio', 'Megane', 'Kadjar', 'Captur'],
  'Mercedes-Benz': ['Classe A', 'Classe C', 'Classe E', 'GLC'],
  Audi: ['A3', 'A4', 'A6', 'Q3', 'Q5'],
  Volkswagen: ['Golf', 'Passat', 'Tiguan', 'T-Roc'],
  Volvo: ['V60', 'V90', 'XC40', 'XC60'],
};
const FUEL_TYPES = ['Todos', 'Diesel', 'Gasolina', 'Híbrido (PHEV)', 'Elétrico'];
const COUNTRIES = { germany: 'Alemanha', france: 'França', netherlands: 'Holanda', belgium: 'Bélgica', spain: 'Espanha' };

// Simple audience estimate based on active country count
function estimateAudience(countrySel, brand, minYear, maxKm) {
  const activeCount = Object.values(countrySel).filter(Boolean).length;
  const base = Math.max(0, 120 - (2024 - Number(minYear)) * 3 - Math.floor(Number(maxKm) / 5000));
  const byCountry = {
    germany: Math.round(base * 0.45),
    france:  Math.round(base * 0.22),
    netherlands: Math.round(base * 0.15),
    belgium: Math.round(base * 0.10),
    spain:   Math.round(base * 0.08),
  };
  const total = Object.entries(byCountry)
    .filter(([k]) => countrySel[k])
    .reduce((s, [, v]) => s + v, 0);
  return { total, byCountry };
}

export default function CreateSearch() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { addToast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vehicle criteria
  const [brand, setBrand] = useState('BMW');
  const [model, setModel] = useState('Série 3');
  const [minYear, setMinYear] = useState(2018);
  const [maxYear, setMaxYear] = useState(2024);
  const [minKm, setMinKm] = useState(0);
  const [maxKm, setMaxKm] = useState(100000);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(30000);
  const [fuel, setFuel] = useState('Todos');

  // Countries
  const [countries, setCountries] = useState({ germany: true, france: false, netherlands: false, belgium: false, spain: false });

  // Margin & notifications
  const [minMargin, setMinMargin] = useState(2500);
  const [alertThreshold, setAlertThreshold] = useState(3000);
  const [alertChannels, setAlertChannels] = useState({ whatsapp: true, email: false });
  const [dailySummary, setDailySummary] = useState(true);

  // Load existing search in edit mode
  useEffect(() => {
    if (!isEdit) return;
    getSearchById(id).then(s => {
      if (!s) { addToast('Pesquisa não encontrada.', 'danger'); navigate('/searches'); return; }
      setBrand(s.criteria?.brand || 'BMW');
      setModel(s.criteria?.model || 'Série 3');
      setMinYear(s.criteria?.minYear || 2018);
      setMaxYear(s.criteria?.maxYear || 2024);
      setMinKm(s.criteria?.minKm || 0);
      setMaxKm(s.criteria?.maxKm || s.criteria?.maxMileage || 100000);
      setMinPrice(s.criteria?.minPrice || 0);
      setMaxPrice(s.criteria?.maxPrice || 30000);
      setFuel(s.criteria?.fuel || 'Todos');
      if (s.criteria?.countries) setCountries(s.criteria.countries);
      setMinMargin(s.minMargin || 2500);
      setAlertThreshold(s.alertThreshold || 3000);
    }).finally(() => setLoading(false));
  }, [id, isEdit, addToast, navigate]);

  const audience = useMemo(
    () => estimateAudience(countries, brand, minYear, maxKm),
    [countries, brand, minYear, maxKm]
  );

  const buildPayload = (status) => ({
    title: `${brand} ${model}`,
    status,
    criteria: { brand, model, minYear: Number(minYear), maxYear: Number(maxYear), minKm: Number(minKm), maxKm: Number(maxKm), maxMileage: Number(maxKm), minPrice: Number(minPrice), maxPrice: Number(maxPrice), fuel, countries },
    sources: Object.entries(countries).filter(([, v]) => v).map(([k]) => ({ germany: 'Mobile.de', france: 'AutoScout24', netherlands: 'Marktplaats', belgium: 'AutoScout24', spain: 'Coches.net' }[k])),
    minMargin: Number(minMargin),
    alertThreshold: Number(alertThreshold),
    alertChannels,
    dailySummary,
    matchesToday: 0,
    avgMargin: Number(minMargin),
  });

  function validateForm() {
    if (Number(minYear) > Number(maxYear)) {
      addToast('O ano mínimo não pode ser superior ao ano máximo.', 'warn');
      return false;
    }
    if (Number(minKm) > Number(maxKm)) {
      addToast('A quilometragem mínima não pode ser superior à máxima.', 'warn');
      return false;
    }
    if (Number(minPrice) > Number(maxPrice)) {
      addToast('O preço mínimo não pode ser superior ao máximo.', 'warn');
      return false;
    }
    if (!alertChannels.whatsapp && !alertChannels.email) {
      addToast('Selecione pelo menos um canal de alerta (WhatsApp ou Email).', 'warn');
      return false;
    }
    if (!Object.values(countries).some(Boolean)) {
      addToast('Selecione pelo menos um país de origem.', 'warn');
      return false;
    }
    return true;
  }

  const handleLaunch = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateSearch(Number(id), buildPayload('active'));
        addToast('Pesquisa atualizada com sucesso!', 'success');
      } else {
        await createSearch(buildPayload('active'));
        addToast('Pesquisa iniciada com sucesso!', 'success');
      }
      navigate('/searches');
    } catch {
      addToast('Erro ao guardar pesquisa. Tente novamente.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateSearch(Number(id), buildPayload('paused'));
      } else {
        await createSearch(buildPayload('paused'));
      }
      addToast('Rascunho guardado.', 'info');
      navigate('/searches');
    } catch {
      addToast('Erro ao guardar rascunho.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="page">
      <div className="page__top">
        <div>
          <h1 className="page__title">{isEdit ? 'Editar Pesquisa' : 'Criar Nova Pesquisa'}</h1>
          <p className="page__sub">Configure os critérios, origens e limites de alerta.</p>
        </div>
        <div className="row gap-3">
          <Btn variant="ghost" onClick={handleSaveDraft} disabled={isSubmitting}>Guardar Rascunho</Btn>
          <Btn variant="primary" onClick={handleLaunch} disabled={isSubmitting}>
            {isSubmitting ? 'A guardar…' : isEdit ? 'Guardar Alterações' : 'Iniciar Pesquisa'}
          </Btn>
        </div>
      </div>

      <div className="page__body" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(500px, 1fr) 350px', gap: '32px', alignItems: 'start' }}>

          <div className="stack gap-6">
            {/* Section 1 — Vehicle */}
            <div className="card">
              <div className="card__body stack gap-5">
                <h2 style={{ fontSize: '15px', fontWeight: '600' }}>1. Critérios do Veículo</h2>

                <div className="form-grid-2">
                  <div className="field">
                    <label className="field__label">Marca</label>
                    <select className="select" value={brand} onChange={e => { setBrand(e.target.value); setModel(MODELS[e.target.value]?.[0] || ''); }}>
                      {BRANDS.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field__label">Modelo</label>
                    <select className="select" value={model} onChange={e => setModel(e.target.value)}>
                      {(MODELS[brand] || []).map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="field">
                    <label className="field__label">Ano</label>
                    <div className="row gap-2">
                      <input type="number" className="input" value={minYear} onChange={e => setMinYear(e.target.value)} placeholder="Mín" />
                      <span className="muted">—</span>
                      <input type="number" className="input" value={maxYear} onChange={e => setMaxYear(e.target.value)} placeholder="Máx" />
                    </div>
                  </div>
                  <div className="field">
                    <label className="field__label">Quilómetros (KMs)</label>
                    <div className="row gap-2">
                      <input type="number" className="input" value={minKm} onChange={e => setMinKm(e.target.value)} placeholder="Mín" />
                      <span className="muted">—</span>
                      <input type="number" className="input" value={maxKm} onChange={e => setMaxKm(e.target.value)} placeholder="Máx" />
                    </div>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="field">
                    <label className="field__label">Preço (€)</label>
                    <div className="row gap-2">
                      <input type="number" className="input" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Mín" />
                      <span className="muted">—</span>
                      <input type="number" className="input" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Máx" />
                    </div>
                  </div>
                  <div className="field">
                    <label className="field__label">Combustível</label>
                    <select className="select" value={fuel} onChange={e => setFuel(e.target.value)}>
                      {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 — Countries */}
            <div className="card">
              <div className="card__body stack gap-4">
                <h2 style={{ fontSize: '15px', fontWeight: '600' }}>2. Países de Origem</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  {Object.entries(COUNTRIES).map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={countries[key]}
                        onChange={e => setCountries(c => ({ ...c, [key]: e.target.checked }))}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--emerald)' }}
                      />
                      <span style={{ fontSize: '13px', color: 'var(--bone)' }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3 — Margin & Alerts */}
            <div className="card">
              <div className="card__body stack gap-5">
                <h2 style={{ fontSize: '15px', fontWeight: '600' }}>3. Margem e Notificações</h2>
                <div className="form-grid-2">
                  <div className="field">
                    <label className="field__label">Margem Mínima Esperada (€)</label>
                    <input type="number" className="input" value={minMargin} onChange={e => setMinMargin(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field__label">Disparar Alerta a partir de (€)</label>
                    <input type="number" className="input" value={alertThreshold} onChange={e => setAlertThreshold(e.target.value)} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: '20px' }}>
                  <div className="field">
                    <label className="field__label" style={{ marginBottom: '8px' }}>Canais de Alerta Instantâneo</label>
                    <div className="row gap-5">
                      <label className="row gap-2" style={{ cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={alertChannels.whatsapp} onChange={e => setAlertChannels(a => ({ ...a, whatsapp: e.target.checked }))} style={{ accentColor: 'var(--emerald)' }} /> WhatsApp
                      </label>
                      <label className="row gap-2" style={{ cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={alertChannels.email} onChange={e => setAlertChannels(a => ({ ...a, email: e.target.checked }))} style={{ accentColor: 'var(--emerald)' }} /> Email
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

          {/* Right panel — live audience estimate */}
          <div style={{ position: 'sticky', top: '28px' }}>
            <div className="card">
              <div className="card__body stack gap-4">
                <h3 style={{ fontSize: '15px', fontWeight: '600' }}>Audiência Estimada</h3>
                <p style={{ color: 'var(--ash)', fontSize: '13px' }}>
                  Anúncios correspondentes antes de aplicar os cálculos de rentabilidade:
                </p>
                <div className="stack gap-1">
                  <span style={{ fontSize: '32px', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--bone)' }}>{audience.total}</span>
                  <span className="muted" style={{ fontSize: '12px' }}>veículos totais na Europa</span>
                </div>
                {audience.total > 0 && (
                  <div className="stack gap-2" style={{ marginTop: '12px', borderTop: '1px solid var(--hairline)', paddingTop: '16px' }}>
                    {Object.entries(COUNTRIES)
                      .filter(([k]) => countries[k] && audience.byCountry[k] > 0)
                      .map(([k, label]) => (
                        <div key={k} className="row" style={{ justifyContent: 'space-between', fontSize: '13px' }}>
                          <span className="muted">{label}</span>
                          <span style={{ fontWeight: 500 }}>{audience.byCountry[k]}</span>
                        </div>
                      ))}
                  </div>
                )}
                <Btn variant="primary" size="lg" style={{ width: '100%', marginTop: '16px' }} onClick={handleLaunch} disabled={isSubmitting}>
                  {isEdit ? 'Guardar Alterações' : 'Iniciar Pesquisa'} <Icon name="arrow" color="#FFF" />
                </Btn>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
