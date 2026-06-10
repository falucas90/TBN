import { useMemo, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import PageTop from '../components/layout/PageTop';
import { Btn, Dot, Icon, Seg } from '../components/ui/Primitives';
import { calculateISV } from '../lib/isv';
import { useToast } from '../context/ToastContext';

const eur = (v) => `€ ${Math.round(v).toLocaleString('pt-PT')}`;

export default function IsvCalculator() {
  const { addToast } = useToast();
  const [mode, setMode] = useState('URL do anúncio');
  const [listingUrl, setListingUrl] = useState('https://suchen.mobile.de/fahrzeuge/details.html?id=412089...');

  // Vehicle specs
  const [carName, setCarName] = useState('BMW 320d Touring');
  const [regDate, setRegDate] = useState('03 / 2019');
  const [cc, setCc] = useState(1995);
  const [km, setKm] = useState(128000);
  const [co2, setCo2] = useState(142);
  const [fuel, setFuel] = useState('Diesel');

  // Import costs
  const [price, setPrice] = useState(18400);
  const [transport, setTransport] = useState(650);
  const [iuc, setIuc] = useState(184);
  const [bufferPct, setBufferPct] = useState(5);

  const ageYears = useMemo(() => {
    const m = String(regDate).match(/(\d{4})/);
    if (!m) return 0;
    return Math.max(0, new Date().getFullYear() - Number(m[1]));
  }, [regDate]);

  const result = useMemo(
    () => calculateISV(Number(cc) || 0, Number(co2) || 0, fuel, ageYears, false, false),
    [cc, co2, fuel, ageYears]
  );

  const landed = useMemo(() => {
    const base = (Number(price) || 0) + result.isvPayable + (Number(transport) || 0) + (Number(iuc) || 0);
    return base * (1 + (Number(bufferPct) || 0) / 100);
  }, [price, transport, iuc, bufferPct, result]);

  const dataComplete = Number(cc) > 0 && Number(co2) > 0;

  return (
    <AppLayout>
      <div className="page">
        <PageTop
          title="Calculadora ISV"
          sub="Cola um anúncio ou introduz especificações. O resto é aritmética."
          right={<Btn variant="ghost" icon="link" onClick={() => addToast('Importação de histórico em breve.', 'info')}>Importar histórico</Btn>}
        />
        <div className="page__body">
          <div className="isv">
            <div>
              <div style={{ marginBottom: 20 }}>
                <Seg options={['URL do anúncio', 'Especificações manuais']} value={mode} onChange={setMode} />
              </div>
              {mode === 'URL do anúncio' && (
                <div className="field" style={{ marginBottom: 24 }}>
                  <label className="field__label">URL Mobile.de / AutoScout24</label>
                  <div className="input-group">
                    <Icon name="link" size={14} />
                    <input className="input" value={listingUrl} onChange={(e) => setListingUrl(e.target.value)} />
                  </div>
                  <span className="field__hint">Importamos preço, marca, modelo, cilindrada, CO₂, data de matrícula e quilometragem.</span>
                </div>
              )}

              <div className="form-section" style={{ paddingTop: 0 }}>
                <div className="form-section__head">
                  <span className="form-section__title">Veículo</span>
                  <span className="form-section__step">{mode === 'URL do anúncio' ? 'Importado' : 'Manual'}</span>
                </div>
                <div className="form-grid-2">
                  <div className="field">
                    <label className="field__label">Marca / Modelo</label>
                    <input className="input" value={carName} onChange={(e) => setCarName(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field__label">Data de matrícula</label>
                    <input className="input" value={regDate} onChange={(e) => setRegDate(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field__label">Cilindrada (cm³)</label>
                    <input className="input tnum" type="number" value={cc} onChange={(e) => setCc(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field__label">Quilómetros</label>
                    <input className="input tnum" type="number" value={km} onChange={(e) => setKm(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field__label">CO₂ (WLTP, g/km)</label>
                    <input className="input tnum" type="number" value={co2} onChange={(e) => setCo2(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field__label">Combustível</label>
                    <select className="select" value={fuel} onChange={(e) => setFuel(e.target.value)}>
                      <option>Diesel</option>
                      <option>Gasolina</option>
                      <option>Híbrido (PHEV)</option>
                      <option>Elétrico</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section__head">
                  <span className="form-section__title">Custo de importação</span>
                  <span className="form-section__step">Editável</span>
                </div>
                <div className="form-grid-2">
                  <div className="field">
                    <label className="field__label">Preço anúncio (€)</label>
                    <input className="input tnum" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field__label">Transporte est. (€)</label>
                    <input className="input tnum" type="number" value={transport} onChange={(e) => setTransport(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field__label">IUC primeiro ano (€)</label>
                    <input className="input tnum" type="number" value={iuc} onChange={(e) => setIuc(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field__label">Buffer (%)</label>
                    <input className="input tnum" type="number" value={bufferPct} onChange={(e) => setBufferPct(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky result */}
            <aside className="isv__result grain">
              <div className="isv__hero">
                <span className="isv__hero-label">ISV estimado</span>
                <div className="isv__hero-number">
                  <span style={{ fontSize: 28, color: 'var(--dust)', fontWeight: 400 }}>€</span>
                  <span>{Math.round(result.isvPayable).toLocaleString('pt-PT')}</span>
                </div>
                <div className="isv__hero-confidence">
                  <Dot tone={dataComplete ? 'emerald' : 'amber'} />
                  {dataComplete ? '± € 150 · dados completos' : '± € 500 · faltam dados'}
                </div>
              </div>
              <div className="isv__breakdown">
                <span className="eyebrow">Discriminação</span>
                <div className="isv__row">
                  <span className="isv__row--label">Componente cilindrada</span>
                  <span className="isv__row--val">{eur(result.ccComponent)}</span>
                </div>
                <div className="isv__row">
                  <span className="isv__row--label">Componente ambiental (CO₂)</span>
                  <span className="isv__row--val">{eur(result.co2Component)}</span>
                </div>
                <div className="isv__row">
                  <span className="isv__row--label">Desconto por idade</span>
                  <span className="isv__row--val" style={{ color: 'var(--emerald)' }}>− {eur(result.ageDiscountAmount)}</span>
                </div>
                <div className="isv__row isv__row--total">
                  <span className="isv__row--val">Total ISV</span>
                  <span className="isv__row--val">{eur(result.isvPayable)}</span>
                </div>
              </div>
              <div className="isv__landed">
                <span className="eyebrow">Landed PT · total</span>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontSize: 24, letterSpacing: '-0.02em' }}>{eur(landed)}</span>
                  <span style={{ fontSize: 11, color: 'var(--dust)' }}>anúncio + ISV + transporte + buffer</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="primary" style={{ flex: 1 }} icon="check" onClick={() => addToast('Estimativa guardada.', 'success')}>Guardar estimativa</Btn>
                <Btn variant="ghost" icon="link" onClick={() => { navigator.clipboard?.writeText(window.location.href); addToast('Ligação copiada.', 'info'); }} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
