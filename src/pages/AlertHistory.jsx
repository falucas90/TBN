import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Card, Badge, Button } from '../components/ui';
import { getAlerts } from '../services/alertsService';
import { calculateISV } from '../lib/isv';
import { ExternalLink, Search } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const DAY_MS = 86400000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// Derive a Portuguese date-group label (and a sort timestamp) from createdAt,
// falling back to the legacy text `date` field for records without a timestamp.
function getDateGroup(alert) {
  if (alert.createdAt) {
    const d = new Date(alert.createdAt);
    if (!isNaN(d)) {
      const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / DAY_MS);
      if (diffDays === 0) return { label: 'Hoje', ts: d.getTime() };
      if (diffDays === 1) return { label: 'Ontem', ts: d.getTime() };
      return {
        label: d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }),
        ts: d.getTime(),
      };
    }
  }
  if (alert.date === 'Today') return { label: 'Hoje', ts: Date.now() };
  if (alert.date === 'Yesterday') return { label: 'Ontem', ts: Date.now() - DAY_MS };
  return { label: alert.date || '—', ts: 0 };
}

export default function AlertHistory() {
  const { addToast } = useToast();

  const [alerts, setAlerts] = useState(null);
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
    .filter(a => filterBrand === 'all' || a.carTitle.toLowerCase().includes(filterBrand))
    .filter(a => filterMargin === 'all' || a.marginEst >= parseInt(filterMargin))
    .filter(a => !searchText || a.carTitle.toLowerCase().includes(searchText.toLowerCase())),
  [alertsWithISV, filterBrand, filterMargin, searchText]);

  // Array of [label, alerts] entries, sorted newest-first
  const groupedAlerts = useMemo(() => {
    const groups = new Map();
    filteredAlerts.forEach(alert => {
      const { label, ts } = getDateGroup(alert);
      if (!groups.has(label)) groups.set(label, { ts, alerts: [] });
      const g = groups.get(label);
      g.ts = Math.max(g.ts, ts);
      g.alerts.push(alert);
    });
    return [...groups.entries()]
      .sort((a, b) => b[1].ts - a[1].ts)
      .map(([label, g]) => [label, g.alerts]);
  }, [filteredAlerts]);

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
         
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {groupedAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ash)' }}>
              Nenhum alerta corresponde aos filtros selecionados.
            </div>
          ) : groupedAlerts.map(([date, alerts]) => (
            <div key={date}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--ash)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {date}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {alerts.map(alert => (
                  <Card key={alert.id} noPadding style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--ash)' }}>{alert.platform}</span>
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
                ))}
              </div>
            </div>
          ))}
        </div>

       </div>
    </AppLayout>
  );
}
