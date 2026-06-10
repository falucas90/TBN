import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import PageTop from '../components/layout/PageTop';
import { Btn, Seg } from '../components/ui/Primitives';
import { useAuth } from '../context/AuthContext';

function Spark({ data, color = 'var(--emerald)', height = 28, width = 120 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ');
  const area = `0,${height} ${points} ${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polygon points={area} fill={color} opacity="0.08" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={(data.length - 1) * step} cy={height - ((data[data.length - 1] - min) / range) * height} r="2.5" fill={color} />
    </svg>
  );
}

const HERO = [
  { k: 'Alertas · 7d', v: '34', d: '+ 12 vs. semana passada', pos: true, spark: [3, 5, 2, 7, 4, 6, 7] },
  { k: 'Margem média', v: '€ 2 980', d: '+ 3,1 % vs. mês passado', pos: true, spark: [2640, 2710, 2680, 2820, 2890, 2940, 2980], emerald: true },
  { k: 'Em negociação', v: '11', d: '4 aguardam resposta', pos: null, spark: [6, 8, 7, 10, 9, 11, 11] },
  { k: 'Pesquisas ativas', v: '5 / 8', d: '3 em pausa', pos: null, spark: [5, 5, 6, 5, 5, 5, 5] },
];

const TRENDS = [
  { model: 'BMW Série 3 diesel', avg: '€ 17 840', delta: '− 3,2 %', trend: 'down', data: [18900, 18700, 18500, 18400, 18100, 17950, 17840] },
  { model: 'Audi A4 Avant TDI', avg: '€ 16 420', delta: '− 1,8 %', trend: 'down', data: [16800, 16700, 16600, 16550, 16500, 16450, 16420] },
  { model: 'Mercedes C220d', avg: '€ 19 680', delta: '+ 0,9 %', trend: 'up', data: [19400, 19450, 19500, 19560, 19600, 19640, 19680] },
  { model: 'VW Passat Variant TDI', avg: '€ 14 280', delta: '− 4,1 %', trend: 'down', data: [14900, 14800, 14700, 14600, 14500, 14380, 14280] },
  { model: 'Volvo V60 D4', avg: '€ 15 920', delta: '+ 1,4 %', trend: 'up', data: [15700, 15750, 15780, 15820, 15860, 15890, 15920] },
];

const FUNNEL = [
  { stage: 'Alertas enviados', n: 142, pct: 100 },
  { stage: 'Abertos', n: 98, pct: 69 },
  { stage: 'Marcados para seguir', n: 34, pct: 24 },
  { stage: 'Em negociação', n: 11, pct: 8 },
  { stage: 'Importados', n: 4, pct: 3 },
];

const PIPELINE = [
  { col: 'Guardados', count: 18, items: ['BMW 320d Munique', 'Audi A4 Avant Hamburgo', 'C220d Berlim'] },
  { col: 'Em negociação', count: 5, items: ['Porsche Macan Zurique', 'Volvo V60 Gotemburgo'] },
  { col: 'Importados', count: 2, items: ['Passat Variant 2019', 'A4 Avant 2018'] },
];

const MONTHS = ['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr'];
const ISV_LINE = [3420, 3510, 3480, 3560, 3620, 3580, 3640];
const MARGIN_LINE = [2640, 2710, 2680, 2820, 2890, 2940, 2980];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [range, setRange] = useState('7 dias');
  const [region, setRegion] = useState('Todos');
  const firstName = (currentUser?.user_metadata?.full_name || '').split(/\s+/)[0] || 'bem-vindo';

  return (
    <AppLayout>
      <div className="page">
        <PageTop
          title="Dashboard"
          sub={`Boa tarde, ${firstName}. 12 alertas hoje · 4 em negociação.`}
          right={<>
            <Seg options={['7 dias', '30 dias', '90 dias']} value={range} onChange={setRange} />
            <Btn variant="ghost" icon="filter">Exportar</Btn>
          </>}
        />
        <div className="page__body">

          {/* ——— Overview row: 4 big numbers ——— */}
          <div className="dash-hero">
            {HERO.map((c, i) => (
              <div key={i} className="dash-hero__card">
                <span className="eyebrow">{c.k}</span>
                <div className={`dash-hero__num ${c.emerald ? 'emerald' : ''}`}>{c.v}</div>
                <div className="dash-hero__foot">
                  <span className={c.pos === true ? 'emerald' : c.pos === false ? 'coral' : 'muted'} style={{ fontSize: 11.5 }}>{c.d}</span>
                  <Spark data={c.spark} color={c.emerald ? 'var(--emerald)' : 'var(--dust)'} width={80} height={22} />
                </div>
              </div>
            ))}
          </div>

          {/* ——— Market pulse ——— */}
          <div className="dash-sect">
            <div className="dash-sect__head">
              <div>
                <h3 className="dash-sect__title">Pulso de mercado</h3>
                <p className="dash-sect__desc">Preço médio de anúncio por modelo, últimos 7 dias. DE / AT / NL.</p>
              </div>
              <Seg options={['Todos', 'DE', 'AT', 'NL']} value={region} onChange={setRegion} />
            </div>
            <div className="dash-card">
              <table className="t">
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th className="num">Preço médio</th>
                    <th className="num">Variação 7d</th>
                    <th style={{ width: 180 }}>Tendência</th>
                    <th className="num">Landed PT est.</th>
                  </tr>
                </thead>
                <tbody>
                  {TRENDS.map((t, i) => (
                    <tr key={i}>
                      <td>{t.model}</td>
                      <td className="num">{t.avg}</td>
                      <td className="num" style={{ color: t.trend === 'down' ? 'var(--emerald)' : 'var(--coral)' }}>{t.delta}</td>
                      <td><Spark data={t.data} color={t.trend === 'down' ? 'var(--emerald)' : 'var(--coral)'} width={160} height={24} /></td>
                      <td className="num">€ {(parseInt(t.avg.replace(/\D/g, ''), 10) * 1.28 / 1000).toFixed(1).replace('.', ',')}k</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dash-grid-2" style={{ marginTop: 32 }}>
            {/* ——— Funnel ——— */}
            <div className="dash-sect" style={{ marginTop: 0 }}>
              <div className="dash-sect__head">
                <div>
                  <h3 className="dash-sect__title">Funil de conversão</h3>
                  <p className="dash-sect__desc">Últimos 30 dias · alerta → importação.</p>
                </div>
                <span className="eyebrow">2,8 % conversão</span>
              </div>
              <div className="dash-card" style={{ padding: 20 }}>
                {FUNNEL.map((f, i) => (
                  <div key={i} className="funnel-row">
                    <div className="funnel-row__head">
                      <span className="funnel-row__stage">{f.stage}</span>
                      <span className="funnel-row__n">
                        <span className="tnum" style={{ color: 'var(--bone)', fontSize: 14 }}>{f.n}</span>
                        <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>{f.pct} %</span>
                      </span>
                    </div>
                    <div className="funnel-row__bar"><div className="funnel-row__fill" style={{ width: `${f.pct}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>

            {/* ——— Cost monitor ——— */}
            <div className="dash-sect" style={{ marginTop: 0 }}>
              <div className="dash-sect__head">
                <div>
                  <h3 className="dash-sect__title">Custo vs. margem</h3>
                  <p className="dash-sect__desc">ISV médio e margem média, últimos 7 meses.</p>
                </div>
              </div>
              <div className="dash-card" style={{ padding: 20 }}>
                <div className="row gap-6" style={{ marginBottom: 16 }}>
                  <div className="row gap-2"><span className="dot" style={{ background: 'var(--dust)' }} /><span style={{ fontSize: 11.5, color: 'var(--ash)' }}>ISV médio</span></div>
                  <div className="row gap-2"><span className="dot dot--emerald" /><span style={{ fontSize: 11.5, color: 'var(--ash)' }}>Margem média</span></div>
                </div>
                <svg viewBox="0 0 320 160" width="100%" height="160" style={{ display: 'block' }}>
                  <g stroke="var(--hairline)" strokeWidth="1">
                    {[0, 40, 80, 120, 160].map(y => <line key={y} x1="0" y1={y} x2="320" y2={y} />)}
                  </g>
                  {(() => {
                    const max = 4000;
                    const step = 320 / (MONTHS.length - 1);
                    const toY = (v) => 160 - (v / max) * 150;
                    const isvPts = ISV_LINE.map((v, i) => `${i * step},${toY(v)}`).join(' ');
                    const marginPts = MARGIN_LINE.map((v, i) => `${i * step},${toY(v)}`).join(' ');
                    return (
                      <>
                        <polyline points={isvPts} fill="none" stroke="var(--dust)" strokeWidth="1.5" strokeDasharray="3 3" />
                        <polygon points={`0,160 ${marginPts} 320,160`} fill="var(--emerald)" opacity="0.08" />
                        <polyline points={marginPts} fill="none" stroke="var(--emerald)" strokeWidth="2" />
                        {MARGIN_LINE.map((v, i) => <circle key={i} cx={i * step} cy={toY(v)} r="2.5" fill="var(--emerald)" />)}
                      </>
                    );
                  })()}
                </svg>
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
                  {MONTHS.map(m => <span key={m} style={{ fontSize: 10.5, color: 'var(--dust)', fontFamily: 'var(--font-mono)' }}>{m}</span>)}
                </div>
              </div>
            </div>
          </div>

          {/* ——— Pipeline ——— */}
          <div className="dash-sect">
            <div className="dash-sect__head">
              <div>
                <h3 className="dash-sect__title">Pipeline</h3>
                <p className="dash-sect__desc">Estado atual dos carros marcados.</p>
              </div>
              <Btn variant="ghost" iconRight="arrow">Ver todos</Btn>
            </div>
            <div className="dash-pipeline">
              {PIPELINE.map((p, i) => (
                <div key={i} className="dash-pipeline__col">
                  <div className="dash-pipeline__head">
                    <span className="dash-pipeline__label">{p.col}</span>
                    <span className="dash-pipeline__count">{p.count}</span>
                  </div>
                  <div className="dash-pipeline__items">
                    {p.items.map((it, j) => (
                      <div key={j} className="dash-pipeline__item">
                        <div className="alert-thumb" style={{ width: 40, height: 30, fontSize: 7 }}>CARRO</div>
                        <span style={{ fontSize: 12.5 }}>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
