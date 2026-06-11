import { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import PageTop from '../../components/layout/PageTop';
import { Dot, Pill, Seg } from '../../components/ui/Primitives';
import { getAdminStats } from '../../services/authService';

const VOLUME = {
  '7 dias': [62, 84, 71, 96, 88, 54, 102],
  '30 dias': [48, 66, 58, 80, 73, 91, 62, 84, 71, 96, 88, 54, 102, 78],
  '90 dias': [30, 44, 52, 61, 58, 70, 66, 80, 74, 88, 92, 84, 96, 90, 102, 98],
};

const SOURCES = [
  { name: 'Mobile.de', status: 'ok', latency: '1,2 s', checked: 'há 2 min' },
  { name: 'AutoScout24', status: 'ok', latency: '0,9 s', checked: 'há 2 min' },
  { name: 'Hey.car', status: 'degraded', latency: '6,4 s', checked: 'há 11 min' },
  { name: 'Kleinanzeigen', status: 'ok', latency: '1,8 s', checked: 'há 3 min' },
];

export default function AdminOverview() {
  const [range, setRange] = useState('7 dias');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => setStats(null));
  }, []);

  const volume = VOLUME[range];
  const labels = range === '7 dias' ? ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] : [];
  const max = Math.max(...volume);
  const v = (k) => (stats ? String(stats[k] ?? 0) : '…');

  const today = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <AdminLayout>
      <div className="page">
        <PageTop
          title="Visão geral"
          sub={`${today.charAt(0).toUpperCase()}${today.slice(1)} · todos os sistemas operacionais`}
          right={<Seg options={['7 dias', '30 dias', '90 dias']} value={range} onChange={setRange} />}
        />
        <div className="page__body" style={{ overflowY: 'auto', padding: '24px 32px' }}>
          <div className="admin-stats">
            <div className="admin-stat">
              <span className="admin-stat__label">Stands registados</span>
              <span className="admin-stat__value">{v('totalUsers')}</span>
              <span className="admin-stat__delta admin-stat__delta--up">contas na plataforma</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat__label">Pesquisas ativas</span>
              <span className="admin-stat__value">{v('activeSearches')}</span>
              <span className="admin-stat__delta">{stats ? `de ${stats.totalSearches} no total` : ''}</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat__label">Alertas · 7 d</span>
              <span className="admin-stat__value">{v('alerts7d')}</span>
              <span className="admin-stat__delta admin-stat__delta--up">envio WhatsApp</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat__label">Alertas totais</span>
              <span className="admin-stat__value">{v('totalAlerts')}</span>
              <span className="admin-stat__delta">desde o lançamento</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12 }}>
            <div className="card">
              <div className="card__head">
                <span style={{ fontSize: 13, fontWeight: 500 }}>Alertas enviados</span>
                <span className="eyebrow">{range}</span>
              </div>
              <div className="card__body">
                <div className="bars">
                  {volume.map((val, i) => (
                    <div key={i} className="bars__bar" style={{ height: `${(val / max) * 100}%` }} title={`${val * 12} alertas`}></div>
                  ))}
                </div>
                {labels.length > 0 && (
                  <div className="bars__labels">
                    {labels.map((l, i) => <span key={i}>{l}</span>)}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card__head">
                <span style={{ fontSize: 13, fontWeight: 500 }}>Fontes</span>
                <Pill tone="emerald"><Dot tone="emerald" />Operacional</Pill>
              </div>
              <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {SOURCES.map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
                    <Dot tone={s.status === 'ok' ? 'emerald' : 'amber'} />
                    <span style={{ flex: 1 }}>{s.name}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--dust)' }}>{s.latency}</span>
                    <span style={{ fontSize: 11, color: 'var(--chalk)' }}>{s.checked}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
