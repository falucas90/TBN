import AppLayout from '../../components/layout/AppLayout';
import PageTop from '../../components/layout/PageTop';

// Billing has no backend yet — no Stripe/payment integration exists anywhere
// in the codebase. Show an honest placeholder instead of fabricated
// MRR/churn/invoice numbers until real billing is built.
export default function AdminBilling() {
  return (
    <AppLayout>
      <div className="page">
        <PageTop
          title="Faturação"
          sub="Beta gratuita — sem faturação"
        />
        <div className="page__body" style={{ overflowY: 'auto', padding: '24px 32px' }}>
          <div className="card" style={{ padding: '48px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--dust)' }}>
            Faturação ainda por implementar. Sem integração de pagamentos — todos os stands estão em acesso gratuito durante a beta.
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
