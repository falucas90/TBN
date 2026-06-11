import { useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import PageTop from '../../components/layout/PageTop';
import { Pill, Seg } from '../../components/ui/Primitives';
import { getAuditLogs, listUsers } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

const KIND = {
  role_change: { label: 'Função', tone: 'emerald' },
  status_change: { label: 'Estado', tone: 'amber' },
};

export default function AdminLogs() {
  const { addToast } = useToast();
  const [logs, setLogs] = useState(null);
  const [filter, setFilter] = useState('Tudo');
  const [emailById, setEmailById] = useState({});
  const emailByIdRef = useRef({});

  useEffect(() => {
    getAuditLogs()
      .then(setLogs)
      .catch(() => {
        addToast('Erro ao carregar registos.', 'danger');
        setLogs([]);
      });
    listUsers({ page: 1, perPage: 100 })
      .then(({ users }) => {
        const next = { ...emailByIdRef.current };
        users.forEach((u) => { if (u.email) next[u.id] = u.email; });
        emailByIdRef.current = next;
        setEmailById(next);
      })
      .catch(() => {});
  }, [addToast]);

  const userRef = (id) => (id ? emailById[id] || `${id.slice(0, 8)}…` : '—');

  const shown = useMemo(() => (logs ?? []).filter(l =>
    filter === 'Tudo' || KIND[l.action]?.label === filter
  ), [logs, filter]);

  return (
    <AppLayout>
      <div className="page">
        <PageTop
          title="Logs & auditoria"
          sub="Retenção de 90 dias · ações de conta assinadas pelo operador"
          right={<Seg options={['Tudo', 'Função', 'Estado']} value={filter} onChange={setFilter} />}
        />
        <div className="page__body" style={{ overflowY: 'auto', padding: '8px 32px 24px' }}>
          <div className="card">
            {logs === null ? (
              [1, 2, 3].map(i => (
                <div key={i} className="log-row">
                  <div style={{ height: 14, background: 'var(--slate)', borderRadius: 4, gridColumn: '1 / -1', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              ))
            ) : shown.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--dust)' }}>
                Sem registos de auditoria.
              </div>
            ) : shown.map((l) => {
              const kind = KIND[l.action] || { label: l.action, tone: 'neutral' };
              return (
                <div key={l.id} className="log-row">
                  <span className="log-row__time">{new Date(l.created_at).toLocaleString('pt-PT')}</span>
                  <span><Pill tone={kind.tone} mono>{kind.label}</Pill></span>
                  <span className="log-row__msg">
                    {userRef(l.target_id)} · {l.old_value} → <strong style={{ fontWeight: 500 }}>{l.new_value}</strong>
                  </span>
                  <span className="log-row__actor mono" style={{ fontSize: 11 }}>{userRef(l.admin_id)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
