import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PageTop from '../components/layout/PageTop';
import { Btn, Icon, Pill, Seg, Switch } from '../components/ui/Primitives';
import WhatsAppCard from '../components/ui/WhatsAppCard';
import { useToast } from '../context/ToastContext';
import { createSearch, updateSearch, getSearchById, deleteSearch } from '../services/searchesService';

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
  const base = Math.max(0, 120 - (2024 - Number(minYear)) * 3 - Math.floor(Number(maxKm) / 5000));
  const byCountry = {
    germany: Math.round(base * 0.45),
    france: Math.round(base * 0.22),
    netherlands: Math.round(base * 0.15),
    belgium: Math.round(base * 0.10),
    spain: Math.round(base * 0.08),
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
  const [status, setStatus] = useState('active');

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
      setStatus(s.status || 'active');
    }).finally(() => setLoading(false));
  }, [id, isEdit, addToast, navigate]);

  const audience = useMemo(
    () => estimateAudience(countries, brand, minYear, maxKm),
    [countries, brand, minYear, maxKm]
  );

  const buildPayload = (newStatus) => ({
    title: `${brand} ${model}`,
    status: newStatus,
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
    if (!Object.values(countries).some(Boolean)) {
      addToast('Selecione pelo menos um país de origem.', 'warn');
      return false;
    }
    return true;
  }

  const handleSave = async (newStatus) => {
    if (newStatus === 'active' && !validateForm()) return;
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateSearch(Number(id), buildPayload(newStatus));
        addToast(newStatus === 'active' ? 'Pesquisa atualizada com sucesso!' : 'Pesquisa guardada em pausa.', 'success');
      } else {
        await createSearch(buildPayload(newStatus));
        addToast(newStatus === 'active' ? 'Pesquisa iniciada com sucesso!' : 'Rascunho guardado.', newStatus === 'active' ? 'success' : 'info');
      }
      navigate('/searches');
    } catch {
      addToast('Erro ao guardar pesquisa. Tente novamente.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Eliminar esta pesquisa? Esta ação é irreversível.')) return;
    setIsSubmitting(true);
    try {
      await deleteSearch(Number(id));
      addToast('Pesquisa eliminada.', 'warn');
      navigate('/searches');
    } catch {
      addToast('Erro ao eliminar pesquisa.', 'danger');
      setIsSubmitting(false);
    }
  };

  const toggleCountry = (k) => setCountries(prev => ({ ...prev, [k]: !prev[k] }));

  if (loading) return null;

  return (
    <AppLayout>
      <div className="page">
        <PageTop
          title={isEdit ? 'Editar pesquisa' : 'Nova pesquisa'}
          sub="Calibra os filtros. Guarda. Começa a receber alertas."
          right={<>
            {isEdit && <Btn variant="danger" onClick={handleDelete} disabled={isSubmitting}>Eliminar</Btn>}
            <Btn variant="ghost" onClick={() => navigate('/searches')} disabled={isSubmitting}>Cancelar</Btn>
            <Btn variant="ghost" onClick={() => handleSave('paused')} disabled={isSubmitting}>
              {isEdit && status === 'active' ? 'Guardar em pausa' : 'Guardar rascunho'}
            </Btn>
            <Btn variant="primary" onClick={() => handleSave('active')} disabled={isSubmitting}>
              {isSubmitting ? 'A guardar…' : 'Guardar e ativar'}
            </Btn>
          </>}
        />
        <div className="page__body" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'flex-start' }}>
          <div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label className="field__label">Nome da pesquisa</label>
              <input className="input" value={`${brand} ${model}`} readOnly />
              <span className="field__hint">Gerado a partir da marca e modelo.</span>
            </div>

            <div className="form-section">
              <div className="form-section__head">
                <span className="form-section__title">Veículo</span>
                <span className="form-section__step">01 / 04</span>
              </div>
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
              <div className="field">
                <label className="field__label">Combustível</label>
                <Seg options={FUEL_TYPES} value={fuel} onChange={setFuel} />
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
                  <label className="field__label">Quilómetros</label>
                  <div className="row gap-2">
                    <input type="number" className="input" value={minKm} onChange={e => setMinKm(e.target.value)} placeholder="Mín" />
                    <span className="muted">—</span>
                    <input type="number" className="input" value={maxKm} onChange={e => setMaxKm(e.target.value)} placeholder="Máx" />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section__head">
                <span className="form-section__title">Preço &amp; margem</span>
                <span className="form-section__step">02 / 04</span>
              </div>
              <div className="form-grid-2">
                <div className="field">
                  <label className="field__label">Preço mín. anúncio (€)</label>
                  <input type="number" className="input" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field__label">Preço máx. anúncio (€)</label>
                  <input type="number" className="input" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="field">
                  <label className="field__label">Margem mínima após ISV (€)</label>
                  <input type="number" className="input" value={minMargin} onChange={e => setMinMargin(e.target.value)} />
                  <span className="field__hint">Antes de ISV, transporte e buffer de 5 %.</span>
                </div>
                <div className="field">
                  <label className="field__label">Disparar alerta a partir de (€)</label>
                  <input type="number" className="input" value={alertThreshold} onChange={e => setAlertThreshold(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section__head">
                <span className="form-section__title">Países de origem</span>
                <span className="form-section__step">03 / 04</span>
              </div>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                {Object.entries(COUNTRIES).map(([k, label]) => (
                  <span key={k} onClick={() => toggleCountry(k)} role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCountry(k); } }}
                    style={{ cursor: 'pointer', display: 'inline-flex' }}>
                    <Pill tone={countries[k] ? 'emerald' : 'neutral'}>
                      {countries[k] && <Icon name="check" size={10} strokeWidth={2} />}
                      {label}
                    </Pill>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-section">
              <div className="form-section__head">
                <span className="form-section__title">Notificações</span>
                <span className="form-section__step">04 / 04</span>
              </div>
              <div className="settings__row">
                <div>
                  <div className="settings__row-label">Receber no WhatsApp</div>
                  <div className="settings__row-desc">O alerta chega minutos depois do anúncio ser publicado.</div>
                </div>
                <Switch checked={alertChannels.whatsapp} onChange={(v) => setAlertChannels(a => ({ ...a, whatsapp: v }))} />
              </div>
              <div className="settings__row">
                <div>
                  <div className="settings__row-label">Receber por email</div>
                  <div className="settings__row-desc">Cópia de cada alerta na caixa de entrada.</div>
                </div>
                <Switch checked={alertChannels.email} onChange={(v) => setAlertChannels(a => ({ ...a, email: v }))} />
              </div>
              <div className="settings__row">
                <div>
                  <div className="settings__row-label">Resumo diário</div>
                  <div className="settings__row-desc">Um email todas as manhãs com a atividade do dia.</div>
                </div>
                <Switch checked={dailySummary} onChange={setDailySummary} />
              </div>
            </div>
          </div>

          {/* Sticky preview */}
          <div style={{ position: 'sticky', top: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 24, background: 'var(--graphite)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)' }}>
              <span className="eyebrow">Correspondências agora</span>
              <div style={{ fontSize: 48, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', marginTop: 6 }}>{audience.total}</div>
              <div style={{ fontSize: 12, color: 'var(--dust)', marginTop: 6 }}>
                Estimativa de 3–7 alertas por semana com estes filtros.
              </div>
              <div className="hr" style={{ margin: '20px 0', height: 1, background: 'var(--hairline)', border: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(COUNTRIES)
                  .filter(([k]) => countries[k])
                  .map(([k, label]) => (
                    <div key={k} className="isv__row">
                      <span className="isv__row--label">{label}</span>
                      <span className="isv__row--val">{audience.byCountry[k]}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <span className="eyebrow" style={{ marginBottom: 12, display: 'block' }}>Pré-visualização do alerta</span>
              <WhatsAppCard />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
