import AdminLayout from '../../components/layout/AdminLayout';
import PageTop from '../../components/layout/PageTop';
import { Btn, Pill } from '../../components/ui/Primitives';
import { useToast } from '../../context/ToastContext';

// Billing has no backend yet — this mirrors the design mock until Stripe lands.
const INVOICES = [
  { ref: 'FT 2026/0612', stand: 'AutoLusa Premium', plan: 'Frota', amount: '€ 189,00', due: '05 Jun', status: 'Paga' },
  { ref: 'FT 2026/0608', stand: 'Stand Marques Auto', plan: 'Pro', amount: '€ 89,00', due: '03 Jun', status: 'Paga' },
  { ref: 'FT 2026/0601', stand: 'ImportCar Norte', plan: 'Pro', amount: '€ 89,00', due: '28 Mai', status: 'Em atraso' },
  { ref: 'FT 2026/0597', stand: 'NorteAuto Import', plan: 'Frota', amount: '€ 189,00', due: '26 Mai', status: 'Paga' },
  { ref: 'FT 2026/0590', stand: 'Viaturas do Tejo', plan: 'Essencial', amount: '€ 39,00', due: '24 Mai', status: 'Paga' },
  { ref: 'FT 2026/0584', stand: 'M&F Automóveis', plan: 'Pro', amount: '€ 89,00', due: '21 Mai', status: 'Em atraso' },
];

const PLANS = [
  { plan: 'Essencial', n: 18, price: '€ 39' },
  { plan: 'Pro', n: 21, price: '€ 89' },
  { plan: 'Frota', n: 8, price: '€ 189' },
];

export default function AdminBilling() {
  const { addToast } = useToast();
  return (
    <AdminLayout>
      <div className="page">
        <PageTop
          title="Faturação"
          sub="MRR € 4 230 · 44 subscrições pagas · churn 1,9%"
          right={<Btn variant="ghost" icon="filter" onClick={() => addToast('Exportação CSV em breve.', 'info')}>Exportar CSV</Btn>}
        />
        <div className="page__body" style={{ overflowY: 'auto', padding: '24px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 12 }}>
            <div className="card">
              <div className="card__head"><span style={{ fontSize: 13, fontWeight: 500 }}>Distribuição por plano</span></div>
              <div className="card__body">
                <div className="plan-dist">
                  {PLANS.map(p => (
                    <div key={p.plan} className="plan-dist__row">
                      <span>{p.plan}</span>
                      <div className="plan-dist__bar"><div className="plan-dist__fill" style={{ width: `${(p.n / 21) * 100}%` }}></div></div>
                      <span className="plan-dist__num">{p.n} · {p.price}</span>
                    </div>
                  ))}
                </div>
                <hr className="hr" style={{ margin: '16px 0', height: 1, background: 'var(--hairline)', border: 0 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--dust)' }}>Receita anual projetada</span>
                  <span className="mono" style={{ color: 'var(--emerald)' }}>€ 50 760</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__head">
                <span style={{ fontSize: 13, fontWeight: 500 }}>Últimas faturas</span>
                <Pill tone="coral">2 em atraso · € 178</Pill>
              </div>
              <table className="t">
                <thead>
                  <tr><th>Fatura</th><th>Stand</th><th>Plano</th><th className="num">Valor</th><th>Vencimento</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {INVOICES.map(inv => (
                    <tr key={inv.ref}>
                      <td className="mono" style={{ fontSize: 11.5 }}>{inv.ref}</td>
                      <td>{inv.stand}</td>
                      <td><Pill mono>{inv.plan}</Pill></td>
                      <td className="num">{inv.amount}</td>
                      <td style={{ color: 'var(--ash)' }}>{inv.due}</td>
                      <td><Pill tone={inv.status === 'Paga' ? 'emerald' : 'coral'}>{inv.status}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
