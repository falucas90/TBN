import React, { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Card, Badge, Button } from '../components/ui';
import { getAlerts } from '../services/alertsService';
import { calculateISV } from '../lib/isv';
import { ExternalLink, Search } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function AlertHistory() {
  const { addToast } = useToast();

  const [alerts, setAlerts] = useState([]);
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterMargin, setFilterMargin] = useState('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    getAlerts().then(setAlerts);
  }, []);

  const alertsWithISV = alerts.map(alert => {
    const { isvPayable } = calculateISV(alert.cc, alert.co2, alert.fuelType, alert.ageYears, alert.flags.includes('PHEV'), false);
    const totalCost = alert.priceOriginal + isvPayable + alert.transportEst;
    const marginEst = alert.marketPrice - totalCost;
    return { ...alert, isvPayable, totalCost, marginEst };
  });

  const filteredAlerts = alertsWithISV
    .filter(a => filterBrand === 'all' || a.carTitle.toLowerCase().includes(filterBrand))
    .filter(a => filterMargin === 'all' || a.marginEst >= parseInt(filterMargin))
    .filter(a => !searchText || a.carTitle.toLowerCase().includes(searchText.toLowerCase()));

  // Group by date
  const groupedAlerts = filteredAlerts.reduce((acc, alert) => {
    if (!acc[alert.date]) acc[alert.date] = [];
    acc[alert.date].push(alert);
    return acc;
  }, {});

  return (
    <AppLayout>
       <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
         
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.25rem' }}>Histórico de Alertas</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Correspondências recentes de inventário em todas as suas pesquisas.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-text-secondary)' }} />
              <input
                type="text"
                placeholder="Pesquisar carros..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ padding: '0.5rem 1rem 0.5rem 2.25rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }}
              />
            </div>
            
            <select 
              value={filterBrand} 
              onChange={e => setFilterBrand(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none', backgroundColor: '#fff' }}
            >
              <option value="all">Todas as Marcas</option>
              <option value="bmw">BMW</option>
              <option value="mercedes">Mercedes-Benz</option>
              <option value="renault">Renault</option>
            </select>

            <select 
              value={filterMargin} 
              onChange={e => setFilterMargin(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none', backgroundColor: '#fff' }}
            >
              <option value="all">Qualquer Margem</option>
              <option value="2000">&gt; €2,000</option>
              <option value="3000">&gt; €3,000</option>
              <option value="4000">&gt; €4,000</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.keys(groupedAlerts).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
              Nenhum alerta corresponde aos filtros selecionados.
            </div>
          ) : Object.entries(groupedAlerts).map(([date, alerts]) => (
            <div key={date}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {date === 'Today' ? 'Hoje' : date === 'Yesterday' ? 'Ontem' : date}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {alerts.map(alert => (
                  <Card key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-secondary)' }}>{alert.platform}</span>
                        {alert.flags.map(flag => (
                          <Badge key={flag} variant={flag === 'PHEV' ? 'success' : 'warn'}>{flag}</Badge>
                        ))}
                      </div>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>{alert.carTitle}</h4>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        <span>Preço Anúncio: €{alert.priceOriginal.toLocaleString()}</span>
                        <span>+ ISV: €{Math.round(alert.isvPayable).toLocaleString()}</span>
                        <span>+ Transp.: €{alert.transportEst.toLocaleString()}</span>
                        <span style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>Total: €{Math.round(alert.totalCost).toLocaleString()}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Margem Est.</div>
                         <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-success-text)' }}>
                           €{Math.round(alert.marginEst).toLocaleString()}
                         </div>
                      </div>
                      <Button onClick={() => addToast('A abrir anúncio original...', 'info')}><ExternalLink size={16} /> Ver</Button>
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
