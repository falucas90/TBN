import React from 'react';
import { Icon, Pill, Btn } from '../components/ui/Primitives';

const mockAlerts = [
  { id: 1, date: 'Hoje', time: '10:42', title: 'Volvo XC90 T8 Inscription', searchName: 'Volvo XC90 PHEV', price: '42,500', isv: '2,150', finalPrice: '44,650', margin: '6,350', link: '#' },
  { id: 2, date: 'Hoje', time: '09:15', title: 'BMW 330e Touring M Sport', searchName: 'BMW 330e', price: '28,900', isv: '1,850', finalPrice: '30,750', margin: '4,250', link: '#' },
  { id: 3, date: 'Ontem', time: '16:30', title: 'Tesla Model 3 Long Range', searchName: 'Tesla Model 3', price: '31,000', isv: '0', finalPrice: '31,000', margin: '5,000', link: '#' },
  { id: 4, date: 'Ontem', time: '11:20', title: 'Volvo XC90 T8 R-Design', searchName: 'Volvo XC90 PHEV', price: '44,000', isv: '2,150', finalPrice: '46,150', margin: '4,850', link: '#' }
];

export default function AlertHistory() {
  const groupedAlerts = mockAlerts.reduce((acc, alert) => {
    if (!acc[alert.date]) acc[alert.date] = [];
    acc[alert.date].push(alert);
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="page__top">
        <div>
          <h1 className="page__title">Histórico de Alertas</h1>
          <p className="page__sub">Oportunidades enviadas via WhatsApp</p>
        </div>
        <Btn variant="ghost" icon="filter">Filtrar</Btn>
      </div>

      <div className="page__body">
        <div className="timeline">
          {Object.entries(groupedAlerts).map(([date, alerts]) => (
            <div key={date}>
              <div className="timeline__day">{date}</div>
              {alerts.map(a => (
                <a key={a.id} href={a.link} className="alert-row" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div className="alert-thumb">Imagem</div>
                  <div>
                    <h4 className="alert-row__title">{a.title}</h4>
                    <div className="alert-row__meta">
                      <span className="mono">{a.time}</span>
                      <span>·</span>
                      <span style={{ color: 'var(--ash)' }}>{a.searchName}</span>
                      <span>·</span>
                      <Pill mono>ISV {a.isv === '0' ? 'Isento' : `€${a.isv}`}</Pill>
                    </div>
                  </div>
                  <div className="price-stack">
                    <div className="price-stack__col">
                      <span className="price-stack__label">Preço Base</span>
                      <span className="price-stack__val">€{a.price}</span>
                    </div>
                    <div className="price-stack__col">
                      <span className="price-stack__label">Custo Final Estimado</span>
                      <span className="price-stack__val">€{a.finalPrice}</span>
                    </div>
                    <div className="price-stack__col" style={{ paddingLeft: '16px', borderLeft: '1px solid var(--hairline)' }}>
                      <span className="price-stack__label">Margem Esperada</span>
                      <span className="price-stack__val price-stack__val--emerald">+€{a.margin}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
