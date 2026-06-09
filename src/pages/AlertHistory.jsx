import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { Card, Badge, Button } from '../components/ui';
import { getAlerts } from '../services/alertsService';
import { getSearches } from '../services/searchesService';
import { calculateISV } from '../lib/isv';
import { Bell, ExternalLink, Search, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

function getDateGroupKey(createdAt, date) {
  if (createdAt) {
    const d = new Date(createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hoje';
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  // Fallback for mock data with string dates
  if (date === 'Today') return 'Hoje';
  if (date === 'Yesterday') return 'Ontem';
  return date ?? 'Desconhecido';
}

function sortGroupKeys(keys) {
  return keys.sort((a, b) => {
    if (a === 'Hoje') return -1;
    if (b === 'Hoje') return 1;
    if (a === 'Ontem') return -1;
    if (b === 'Ontem') return 1;
    // Parse DD/MM/YYYY dates for comparison
    const parseDate = (s) => {
      const parts = s.split('/');
      if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      return new Date(0);
    };
    return parseDate(b) - parseDate(a);
  });
}

export default function AlertHistory() {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [alerts, setAlerts] = useState(null);
  const [searches, setSearches] = useState([]);
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterMargin, setFilterMargin] = useState('all');
  const [searchText, setSearchText] = useState('');

  const searchParamId = searchParams.get('search');

  useEffect(() => {
    getAlerts().then(setAlerts).catch(() => {
      addToast('Erro ao carregar alertas.', 'danger');
      setAlerts([]);
    });
    getSearches().then(setSearches).catch(() => {});
  }, [addToast]);

  const searchesMap = useMemo(() => {
    const map = {};
    searches.forEach(s => { map[String(s.id)] = s.title; });
    return map;
  }, [searches]);

  const activeSearchName = searchParamId ? (searchesMap[String(searchParamId)] ?? `Pesquisa ${searchParamId}`) : null;

  const brandOptions = useMemo(() => {
    if (!alerts) return [];
    const brands = [...new Set(alerts.map(a => a.carTitle.split(' ')[0].toLowerCase()))].sort();
    return brands;
  }, [alerts]);

  const alertsWithISV = useMemo(() => (alerts ?? []).map(alert => {
    const { isvPayable } = calculateISV(alert.cc, alert.co2, alert.fuelType, alert.ageYears, alert.flags.includes('PHEV'), false);
    const totalCost = alert.priceOriginal + isvPayable + alert.transportEst;
    const marginEst = alert.marketPrice - totalCost;
    return { ...alert, isvPayable, totalCost, marginEst };
  }), [alerts]);

  const filteredAlerts = useMemo(() => alertsWithISV
    .filter(a => !searchParamId || String(a.searchId) === String(searchParamId))
    .filter(a => filterBrand === 'all' || a.carTitle.toLowerCase().includes(filterBrand))
    .filter(a => filterMargin === 'all' || a.marginEst >= parseInt(filterMargin))
    .filter(a => !searchText || a.carTitle.toLowerCase().includes(searchText.toLowerCase())),
  [alertsWithISV, searchParamId, filterBrand, filterMargin, searchText]);

  const groupedAlerts = useMemo(() => {
    const acc = filteredAlerts.reduce((map, alert) => {
      const key = getDateGroupKey(alert.createdAt, alert.date);
      if (!map[key]) map[key] = [];
      map[key].push(alert);
      return map;
    }, {});
    return acc;
  }, [filteredAlerts]);

  const sortedGroupKeys = useMemo(() => sortGroupKeys(Object.keys(groupedAlerts)), [groupedAlerts]);

  function clearAllFilters() {
    setFilterBrand('all');
    setFilterMargin('all');
    setSearchText('');
    setSearchParams({});
  }

  if (alerts === null) return (
    <AppLayout>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: '90px', background: 'var(--graphite)', borderRadius: 'var(--r-lg)', marginBottom: '0.75rem', animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.6 }} />
        ))}
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
       <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>

         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: activeSearchName ? '1rem' : '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '500', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Histórico de Alertas</h1>
            <p style={{ color: 'var(--dust)', fontSize: '13px' }}>Correspondências recentes de inventário em todas as suas pesquisas.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--ash)' }} />
              <input
                type="text"
                placeholder="Pesquisar carros..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ padding: '0 1rem 0 2.25rem', height: '36px', borderRadius: 'var(--r-md)', border: '1px solid var(--hairline)', outline: 'none', background: 'var(--graphite)', color: 'var(--bone)', fontSize: '13px', fontFamily: 'inherit' }}
              />
            </div>

            <select
              value={filterBrand}
              onChange={e => setFilterBrand(e.target.value)}
              style={{ height: '36px', padding: '0 10px', borderRadius: 'var(--r-md)', border: '1px solid var(--hairline)', outline: 'none', background: 'var(--graphite)', color: 'var(--bone)', fontSize: '13px', fontFamily: 'inherit' }}
            >
              <option value="all">Todas as Marcas</option>
              {brandOptions.map(b => (
                <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
              ))}
            </select>

            <select
              value={filterMargin}
              onChange={e => setFilterMargin(e.target.value)}
              style={{ height: '36px', padding: '0 10px', borderRadius: 'var(--r-md)', border: '1px solid var(--hairline)', outline: 'none', background: 'var(--graphite)', color: 'var(--bone)', fontSize: '13px', fontFamily: 'inherit' }}
            >
              <option value="all">Qualquer Margem</option>
              <option value="2000">&gt; €2,000</option>
              <option value="3000">&gt; €3,000</option>
              <option value="4000">&gt; €4,000</option>
            </select>
          </div>
        </div>

        {activeSearchName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '13px', color: 'var(--ash)' }}>A filtrar por:</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.25rem 0.625rem', borderRadius: 'var(--r-full, 9999px)',
              background: 'var(--graphite)', border: '1px solid var(--hairline)',
              fontSize: '13px', fontWeight: '500', color: 'var(--bone)'
            }}>
              {activeSearchName}
              <button
                onClick={() => setSearchParams({})}
                style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ash)', padding: '0', lineHeight: 1 }}
                aria-label="Remover filtro de pesquisa"
              >
                <X size={13} />
              </button>
            </span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {alertsWithISV.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 2rem', color: 'var(--ash)', gap: '1rem', textAlign: 'center' }}>
              <Bell size={40} strokeWidth={1.5} style={{ opacity: 0.4 }} />
              <div>
                <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--bone)', marginBottom: '0.5rem' }}>Ainda sem alertas</p>
                <p style={{ fontSize: '13px', maxWidth: '360px' }}>Quando uma pesquisa encontrar um carro que corresponda aos seus critérios, aparecerá aqui.</p>
              </div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 2rem', color: 'var(--ash)', gap: '1rem', textAlign: 'center' }}>
              <p style={{ fontSize: '13px' }}>Nenhum alerta corresponde aos filtros. Tente ajustar os critérios.</p>
              <Button variant="secondary" onClick={clearAllFilters}>Limpar filtros</Button>
            </div>
          ) : sortedGroupKeys.map(date => (
            <div key={date}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--ash)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {date}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {groupedAlerts[date].map(alert => {
                  const searchTitle = alert.searchId ? (searchesMap[String(alert.searchId)] ?? null) : null;
                  return (
                    <Card key={alert.id} noPadding style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--ash)' }}>{alert.platform}</span>
                          {searchTitle && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--dust)' }}>{searchTitle}</span>
                          )}
                          {alert.flags.map(flag => (
                            <Badge key={flag} variant={flag === 'PHEV' ? 'success' : 'warn'}>{flag}</Badge>
                          ))}
                        </div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>{alert.carTitle}</h4>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--ash)' }}>
                          <span>Preço Anúncio: €{alert.priceOriginal.toLocaleString()}</span>
                          <span>+ ISV: €{Math.round(alert.isvPayable).toLocaleString()}</span>
                          <span>+ Transp.: €{alert.transportEst.toLocaleString()}</span>
                          <span style={{ fontWeight: '500', color: 'var(--bone)' }}>Total: €{Math.round(alert.totalCost).toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ textAlign: 'right' }}>
                           <div style={{ fontSize: '0.75rem', color: 'var(--ash)' }}>Margem Est.</div>
                           <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--emerald)' }}>
                             €{Math.round(alert.marginEst).toLocaleString()}
                           </div>
                        </div>
                        <Button onClick={() => window.open(alert.listingUrl, '_blank', 'noopener,noreferrer')}><ExternalLink size={16} /> Ver</Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

       </div>
    </AppLayout>
  );
}
