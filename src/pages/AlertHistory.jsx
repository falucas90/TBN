import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import PageTop from '../components/layout/PageTop';
import { Btn, Icon, Pill, Seg } from '../components/ui/Primitives';
import { getAlerts } from '../services/alertsService';
import { calculateISV } from '../lib/isv';
import { useToast } from '../context/ToastContext';

const eur = (v) => `€ ${Math.round(v).toLocaleString('pt-PT')}`;

// Car titles start with the model year ("2021 BMW 320e Touring") — skip a
// leading 4-digit token so the brand is the first real word.
function getBrand(carTitle) {
  const words = carTitle.trim().split(/\s+/);
  const brand = /^\d{4}$/.test(words[0]) ? words[1] : words[0];
  return (brand ?? '').toLowerCase();
}

function dayLabel(date) {
  if (date === 'Today') return 'Hoje';
  if (date === 'Yesterday') return 'Ontem';
  return date;
}

function timeOf(alert) {
  if (!alert.createdAt) return null;
  const d = new Date(alert.createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

export default function AlertHistory() {
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState(null);
  const [view, setView] = useState('Todos');
  const [showFilters, setShowFilters] = useState(false);
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterMargin, setFilterMargin] = useState('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    getAlerts().then(setAlerts).catch(() => {
      addToast('Erro ao carregar alertas.', 'danger');
      setAlerts([]);
    });
  }, [addToast]);

  const brandOptions = useMemo(() => {
    if (!alerts) return [];
    return [...new Set(alerts.map(a => getBrand(a.carTitle)).filter(Boolean))].sort();
  }, [alerts]);

  const enriched = useMemo(() => (alerts ?? []).map(alert => {
    // EVs are ISV-exempt in Portugal — calculateISV would otherwise tax them
    // on the petrol table, so short-circuit to a zeroed ISV, same as the
    // fuel === 'Elétrico' branch in IsvCalculator.jsx.
    const isvPayable = alert.fuelType === 'Elétrico'
      ? 0
      : calculateISV(alert.cc, alert.co2, alert.fuelType, alert.ageYears, alert.flags.includes('PHEV'), false).isvPayable;
    const totalCost = alert.priceOriginal + isvPayable + alert.transportEst;
    // Without a market price the margin is unknown — keep it null rather than
    // letting `null - totalCost` produce NaN, which renders as "€ NaN" and
    // silently fails every numeric margin comparison.
    const marginEst = alert.marketPrice == null ? null : alert.marketPrice - totalCost;
    return { ...alert, isvPayable, totalCost, marginEst };
  }), [alerts]);

  const filtered = useMemo(() => enriched
    .filter(a => filterBrand === 'all' || getBrand(a.carTitle) === filterBrand)
    // A row with an unknown margin can't be claimed to clear a "> €X" threshold,
    // so exclude it explicitly when a margin filter is active (not via a silent
    // NaN comparison).
    .filter(a => filterMargin === 'all' || (a.marginEst != null && a.marginEst >= parseInt(filterMargin, 10)))
    .filter(a => !searchText || a.carTitle.toLowerCase().includes(searchText.toLowerCase())),
  [enriched, filterBrand, filterMargin, searchText]);

  const grouped = useMemo(() => filtered.reduce((acc, alert) => {
    (acc[alert.date] ??= []).push(alert);
    return acc;
  }, {}), [filtered]);

  return (
    <AppLayout>
      <div className="page">
        <PageTop
          title="Histórico de alertas"
          sub={alerts === null ? 'A carregar…' : `${alerts.length} alertas · últimos 30 dias`}
          right={<>
            <Seg options={['Todos', 'Abertos', 'Descartados']} value={view} onChange={setView} />
            <Btn variant="ghost" icon="filter" onClick={() => setShowFilters(v => !v)}>Filtros</Btn>
          </>}
        />
        <div className="page__body">
          {showFilters && (
            <div className="row gap-3" style={{ marginBottom: 24, flexWrap: 'wrap' }}>
              <div className="input-group" style={{ width: 220 }}>
                <Icon name="search" size={14} />
                <input className="input" placeholder="Pesquisar carros" value={searchText} onChange={e => setSearchText(e.target.value)} />
              </div>
              <select className="select" style={{ width: 180 }} value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
                <option value="all">Todas as marcas</option>
                {brandOptions.map(b => (
                  <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
                ))}
              </select>
              <select className="select" style={{ width: 180 }} value={filterMargin} onChange={e => setFilterMargin(e.target.value)}>
                <option value="all">Qualquer margem</option>
                <option value="2000">&gt; € 2 000</option>
                <option value="3000">&gt; € 3 000</option>
                <option value="4000">&gt; € 4 000</option>
              </select>
            </div>
          )}

          {alerts === null ? (
            <div className="timeline">
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 86, background: 'var(--graphite)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--dust)' }}>
              Nenhum alerta corresponde aos filtros selecionados.
            </div>
          ) : (
            <div className="timeline">
              {Object.entries(grouped).map(([date, dayAlerts]) => (
                <div key={date}>
                  <div className="timeline__day">{dayLabel(date)}</div>
                  {dayAlerts.map(a => {
                    const time = timeOf(a);
                    const risk = a.flags.find(f => f !== 'PHEV');
                    return (
                      <div
                        key={a.id}
                        className="alert-row"
                        role="button"
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                        onClick={() => window.open(a.listingUrl, '_blank', 'noopener,noreferrer')}
                        onKeyDown={(e) => { if (e.key === 'Enter') window.open(a.listingUrl, '_blank', 'noopener,noreferrer'); }}
                      >
                        <div className="alert-thumb">CARRO</div>
                        <div>
                          <div className="alert-row__title">{a.carTitle}</div>
                          <div className="alert-row__meta">
                            <span>{a.platform}</span>
                            {time && <><span style={{ color: 'var(--hairline-strong)' }}>·</span><span className="mono">{time}</span></>}
                            {a.flags.includes('PHEV') && <><span style={{ color: 'var(--hairline-strong)' }}>·</span><Pill tone="emerald">PHEV</Pill></>}
                            {risk && <><span style={{ color: 'var(--hairline-strong)' }}>·</span><Pill tone="amber"><Icon name="alert" size={10} strokeWidth={1.8} />{risk}</Pill></>}
                          </div>
                        </div>
                        <div className="price-stack">
                          <div className="price-stack__col">
                            <span className="price-stack__label">Anúncio</span>
                            <span className="price-stack__val">{eur(a.priceOriginal)}</span>
                          </div>
                          <div className="price-stack__col">
                            <span className="price-stack__label">Landed PT</span>
                            <span className="price-stack__val">{eur(a.totalCost)}</span>
                          </div>
                          <div className="price-stack__col">
                            <span className="price-stack__label">Margem</span>
                            {a.marginEst == null ? (
                              <span className="price-stack__val" style={{ color: 'var(--dust)' }}>—</span>
                            ) : (
                              <span className="price-stack__val price-stack__val--emerald">+ {eur(a.marginEst)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
