import { useState, useEffect, useRef, useCallback } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button, Toggle, StatCard } from '../components/ui';
import { listUsers, updateUserRole, updateUserStatus, getAuditLogs, getAdminStats } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const PER_PAGE = 25;

const skeletonStyle = {
  backgroundColor: 'var(--hairline)',
  borderRadius: '4px',
  height: '14px',
  display: 'inline-block',
};

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
      <td style={{ padding: '0.875rem 1rem' }}><span style={{ ...skeletonStyle, width: '100px' }} /></td>
      <td style={{ padding: '0.875rem 1rem' }}><span style={{ ...skeletonStyle, width: '160px' }} /></td>
      <td style={{ padding: '0.875rem 1rem' }}><span style={{ ...skeletonStyle, width: '60px' }} /></td>
      <td style={{ padding: '0.875rem 1rem' }}><span style={{ ...skeletonStyle, width: '60px' }} /></td>
      <td style={{ padding: '0.875rem 1rem' }}><span style={{ ...skeletonStyle, width: '80px' }} /></td>
      <td style={{ padding: '0.875rem 1rem' }}><span style={{ ...skeletonStyle, width: '70px' }} /></td>
    </tr>
  );
}

export default function Admin() {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [pendingRoles, setPendingRoles] = useState({});
  const [savingRows, setSavingRows] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [auditFilter, setAuditFilter] = useState('all');
  const [emailById, setEmailById] = useState({});
  const emailByIdRef = useRef({});

  const mergeEmails = useCallback((list) => {
    const next = { ...emailByIdRef.current };
    list.forEach((u) => {
      if (u.email) next[u.id] = u.email;
    });
    emailByIdRef.current = next;
    setEmailById(next);
  }, []);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setIsLoadingStats(false));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    listUsers({ page, perPage: PER_PAGE })
      .then(({ users: data, hasMore: more, total: count }) => {
        setUsers(data);
        setHasMore(more);
        setTotal(count);
        mergeEmails(data);
        const initial = {};
        data.forEach((u) => { initial[u.id] = u.app_metadata?.role || u.user_metadata?.role || 'dealer'; });
        setPendingRoles(initial);
      })
      .catch(() => addToast('Erro ao carregar utilizadores.', 'danger'))
      .finally(() => setIsLoading(false));
  }, [page, addToast, mergeEmails]);

  useEffect(() => {
    if (tab !== 'audit') return;
    setIsLoadingLogs(true);
    getAuditLogs()
      .then(setAuditLogs)
      .catch(() => addToast('Erro ao carregar registos.', 'danger'))
      .finally(() => setIsLoadingLogs(false));
    // If the audit tab is opened before any users have loaded, fetch page 1
    // so we can resolve emails in the log table.
    if (Object.keys(emailByIdRef.current).length === 0) {
      listUsers({ page: 1, perPage: PER_PAGE })
        .then(({ users: fetched }) => mergeEmails(fetched))
        .catch(() => {});
    }
  }, [tab, addToast, mergeEmails]);

  const formatUserRef = (id) => {
    if (!id) return '—';
    return emailById[id] || `${id.slice(0, 8)}…`;
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = normalizedQuery
    ? users.filter((u) => {
        const name = u.user_metadata?.full_name || u.user_metadata?.name || '';
        return (
          name.toLowerCase().includes(normalizedQuery) ||
          (u.email || '').toLowerCase().includes(normalizedQuery)
        );
      })
    : users;

  const filteredLogs = auditFilter === 'all'
    ? auditLogs
    : auditLogs.filter((log) => log.action === auditFilter);

  async function handleSaveRole(user) {
    const newRole = pendingRoles[user.id];
    const isSelfDemotion = user.id === currentUser?.id && newRole !== 'admin';
    setSavingRows((prev) => ({ ...prev, [user.id]: true }));
    try {
      await updateUserRole(user.id, newRole);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, user_metadata: { ...u.user_metadata, role: newRole } }
            : u
        )
      );
      if (isSelfDemotion) {
        addToast('Vai perder acesso de administrador no próximo início de sessão.', 'warn');
      } else {
        addToast('Função do utilizador atualizada com sucesso.', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao atualizar função.', 'danger');
    } finally {
      setSavingRows((prev) => ({ ...prev, [user.id]: false }));
    }
  }

  async function handleToggleStatus(user) {
    const currentStatus = user.app_metadata?.status || user.user_metadata?.status || 'active';
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateUserStatus(user.id, newStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, app_metadata: { ...u.app_metadata, status: newStatus } }
            : u
        )
      );
      addToast(
        newStatus === 'active' ? 'Utilizador ativado com sucesso.' : 'Utilizador desativado com sucesso.',
        'success'
      );
    } catch (err) {
      addToast(err.message || 'Erro ao atualizar estado.', 'danger');
    }
  }

  const thStyle = {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    fontWeight: '600',
    color: 'var(--ash)',
    whiteSpace: 'nowrap',
  };

  const tdStyle = { padding: '0.875rem 1rem' };

  return (
    <AppLayout>
      <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Painel de Administração
        </h1>
        <p style={{ color: 'var(--ash)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Contas de revendedores registadas na plataforma
        </p>

        {/* Platform metrics */}
        {(isLoadingStats || stats) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard label="Utilizadores" value={isLoadingStats ? '…' : String(stats.totalUsers)} />
            <StatCard
              label="Pesquisas Ativas"
              value={isLoadingStats ? '…' : String(stats.activeSearches)}
              trendLabel={isLoadingStats ? undefined : `de ${stats.totalSearches} no total`}
            />
            <StatCard label="Alertas (7d)" value={isLoadingStats ? '…' : String(stats.alerts7d)} />
            <StatCard label="Alertas Totais" value={isLoadingStats ? '…' : String(stats.totalAlerts)} />
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--hairline)', paddingBottom: '0' }}>
          {[['users', 'Utilizadores'], ['audit', 'Registo de Auditoria']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
              fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: tab === key ? 600 : 400,
              color: tab === key ? 'var(--bone)' : 'var(--ash)',
              borderBottom: tab === key ? '2px solid var(--emerald)' : '2px solid transparent',
              marginBottom: '-1px',
            }}>{label}</button>
          ))}
        </div>

        {tab === 'audit' && (
          <Card>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--hairline)' }}>
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                aria-label="Filtrar por ação"
                style={{
                  padding: '0.4rem 0.6rem',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--hairline)',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="all">Todas as ações</option>
                <option value="role_change">Função</option>
                <option value="status_change">Estado</option>
              </select>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                    {['Data', 'Admin', 'Utilizador', 'Ação', 'Antes', 'Depois'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoadingLogs ? (
                    <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                  ) : filteredLogs.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--ash)' }}>Nenhum registo encontrado</td></tr>
                  ) : filteredLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                      <td style={{ ...tdStyle, color: 'var(--ash)', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString('pt-PT')}</td>
                      <td style={tdStyle}>{formatUserRef(log.admin_id)}</td>
                      <td style={tdStyle}>{formatUserRef(log.target_id)}</td>
                      <td style={tdStyle}>{log.action === 'role_change' ? 'Função' : 'Estado'}</td>
                      <td style={{ ...tdStyle, color: 'var(--ash)' }}>{log.old_value}</td>
                      <td style={{ ...tdStyle, fontWeight: 500, color: 'var(--bone)' }}>{log.new_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === 'users' && <Card>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--hairline)' }}>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por nome ou email…"
              aria-label="Filtrar por nome ou email"
              style={{
                width: '100%',
                maxWidth: '320px',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--hairline)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                outline: 'none',
                background: 'transparent',
                color: 'var(--bone)',
              }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <th style={thStyle}>Nome</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Plano</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Função</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--ash)' }}
                    >
                      Nenhum utilizador encontrado
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const loadedRole = user.app_metadata?.role || user.user_metadata?.role || 'dealer';
                    const currentStatus = user.app_metadata?.status || user.user_metadata?.status || 'active';
                    const isActive = currentStatus === 'active';
                    const pendingRole = pendingRoles[user.id] ?? loadedRole;
                    const isDirty = pendingRole !== loadedRole;
                    const isSaving = !!savingRows[user.id];
                    const displayName =
                      user.user_metadata?.full_name ||
                      user.user_metadata?.name ||
                      user.email?.split('@')[0] ||
                      '—';
                    const plan = user.user_metadata?.plan || '—';

                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                        <td style={{ ...tdStyle, fontWeight: '500' }}>{displayName}</td>
                        <td style={{ ...tdStyle, color: 'var(--ash)' }}>{user.email}</td>
                        <td style={tdStyle}>{plan}</td>
                        <td style={tdStyle}>
                          <Toggle
                            checked={isActive}
                            onChange={() => handleToggleStatus(user)}
                            label={isActive ? 'Ativo' : 'Inativo'}
                          />
                        </td>
                        <td style={tdStyle}>
                          <select
                            value={pendingRole}
                            onChange={(e) =>
                              setPendingRoles((prev) => ({ ...prev, [user.id]: e.target.value }))
                            }
                            style={{
                              padding: '0.4rem 0.6rem',
                              borderRadius: 'var(--r-md)',
                              border: '1px solid var(--hairline)',
                              fontSize: '0.875rem',
                              fontFamily: 'inherit',
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="dealer">Dealer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={tdStyle}>
                          <Button
                            variant="ghost"
                            onClick={() => handleSaveRole(user)}
                            disabled={!isDirty || isSaving}
                          >
                            {isSaving ? 'A guardar…' : 'Guardar'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid var(--hairline)' }}>
            <Button
              variant="ghost"
              disabled={page === 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span style={{ color: 'var(--ash)', fontSize: '0.8125rem' }}>
              {total != null
                ? `Página ${page} de ${Math.max(1, Math.ceil(total / PER_PAGE))}`
                : `Página ${page}`}
            </span>
            <Button
              variant="ghost"
              disabled={!hasMore || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Seguinte
            </Button>
          </div>
        </Card>}
      </div>
    </AppLayout>
  );
}
