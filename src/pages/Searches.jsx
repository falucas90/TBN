import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PageTop from '../components/layout/PageTop';
import { Btn, Dot, Icon, NumPair } from '../components/ui/Primitives';
import { OnboardingPanel } from '../components/ui';
import { getSearches, createSearch } from '../services/searchesService';
import { getAlertCountSince } from '../services/alertsService';
import { useToast } from '../context/ToastContext';

const ONBOARDING_KEY = 'crivo_onboarding_dismissed';

const SAMPLE_PAYLOAD = {
  title: '[Exemplo] BMW Série 3',
  status: 'paused',
  criteria: {
    brand: 'BMW',
    model: 'Série 3',
    minYear: 2018,
    maxYear: 2024,
    minKm: 0,
    maxKm: 120000,
    maxMileage: 120000,
    minPrice: 0,
    maxPrice: 30000,
    fuel: 'Diesel',
    countries: { germany: true, france: false, netherlands: false, belgium: false, spain: false },
  },
  sources: ['Mobile.de'],
  minMargin: 2500,
  alertThreshold: 3000,
  alertChannels: { whatsapp: false, email: true },
  dailySummary: true,
  matchesToday: 0,
  avgMargin: 2500,
};

function summarize(s) {
  const c = s.criteria || {};
  const parts = [
    [c.brand, c.model].filter(Boolean).join(' '),
    c.fuel,
    c.minYear ? `${c.minYear}${c.maxYear ? `–${c.maxYear}` : '+'}` : null,
    (c.maxKm ?? c.maxMileage) ? `<${Math.round((c.maxKm ?? c.maxMileage) / 1000)}k km` : null,
    c.maxPrice ? `€${Math.round((c.minPrice || 0) / 1000)}k–€${Math.round(c.maxPrice / 1000)}k` : null,
    (s.sources || []).join('/') || null,
  ];
  return parts.filter(Boolean).join(' · ');
}

export default function Searches() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searches, setSearches] = useState(undefined);
  const [alertCount7d, setAlertCount7d] = useState(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(ONBOARDING_KEY) === '1'
  );

  const loadSearches = useCallback(() => (
    getSearches().then(setSearches).catch(() => {
      addToast('Erro ao carregar pesquisas.', 'danger');
      setSearches([]);
    })
  ), [addToast]);

  useEffect(() => {
    loadSearches();
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    getAlertCountSince(cutoff).then(setAlertCount7d).catch(() => setAlertCount7d(0));
  }, [loadSearches]);

  const dismissOnboarding = useCallback(() => {
    try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* ignore */ }
    setOnboardingDismissed(true);
  }, []);

  const createSampleSearch = useCallback(async () => {
    try {
      await createSearch(SAMPLE_PAYLOAD);
      await loadSearches();
      addToast('Pesquisa de exemplo criada — pode editá-la ou eliminá-la.', 'success');
    } catch {
      addToast('Erro ao criar pesquisa de exemplo.', 'danger');
    }
  }, [addToast, loadSearches]);

  const shown = useMemo(() => {
    if (!searches) return [];
    const q = query.trim().toLowerCase();
    if (!q) return searches;
    return searches.filter(s => (s.title + ' ' + summarize(s)).toLowerCase().includes(q));
  }, [searches, query]);

  const activeCount = (searches || []).filter(s => s.status === 'active').length;

  return (
    <AppLayout>
      <div className="page">
        <PageTop
          title="Pesquisas"
          sub={searches === undefined
            ? 'A carregar…'
            : `${searches.length} pesquisas · ${activeCount} ativas · última atualização há 2 min`}
          right={<>
            <div className="input-group" style={{ width: 240 }}>
              <Icon name="search" size={14} />
              <input className="input" placeholder="Filtrar pesquisas" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Btn variant="primary" icon="plus" onClick={() => navigate('/searches/new')}>Nova pesquisa</Btn>
          </>}
        />
        <div className="page__body">
          {!onboardingDismissed && (
            <OnboardingPanel onCreateSample={createSampleSearch} onDismiss={dismissOnboarding} />
          )}
          {searches === undefined ? (
            <div className="searches-grid">
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 170, background: 'var(--graphite)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : (
            <>
              <div className="searches-grid">
                {shown.map((s) => {
                  const active = s.status === 'active';
                  return (
                    <div
                      key={s.id}
                      className="search-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/searches/${s.id}/edit`)}
                      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/searches/${s.id}/edit`); }}
                    >
                      <div className="search-card__head">
                        <div className="search-card__name">{s.title}</div>
                        <div className="search-card__status">
                          <Dot tone={active ? 'emerald' : 'dust'} />
                          {active ? 'Ativa' : 'Em pausa'}
                        </div>
                      </div>
                      <div className="search-card__summary">{summarize(s)}</div>
                      <div className="search-card__stats">
                        <NumPair label="Agora" value={active ? String(s.matchesToday ?? 0) : '—'} big />
                        <NumPair label="7 dias" value={alertCount7d === null ? '…' : String(alertCount7d)} big />
                        <NumPair
                          label="Margem méd."
                          value={active && s.avgMargin ? `€ ${s.avgMargin.toLocaleString('pt-PT')}` : '—'}
                          big
                          emerald={active && !!s.avgMargin}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {shown.length === 0 && (
                <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--dust)' }}>
                  {query ? `Sem pesquisas para “${query}”.` : 'Ainda não tem pesquisas. Crie a primeira.'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
