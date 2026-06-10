import { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button, Toggle } from '../components/ui';
import { listUsers, updateUserRole, updateUserStatus, getAuditLogs } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

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

  useEffect(() => {
    listUsers()
      .then((data) => {
        setUsers(data);
        const initial = {};
        data.forEach((u) => { initial[u.id] = u.app_metadata?.role || u.user_metadata?.role || 'dealer'; });
        setPendingRoles(initial);
      })
      .catch(() => addToast('Erro ao carregar utilizadores.', 'danger'))
      .finally(() => setIsLoading(false));
  }, [addToast]);

  useEffect(() => {
    if (tab !== 'audit') return;
    setIsLoadingLogs(true);
    getAuditLogs()
      .then(setAuditLogs)
      .catch(() => addToast('Erro ao carregar registos.', 'danger'))
      .finally(() => setIsLoadingLogs(false));
  }, [tab, addToast]);

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
    const currentStatus = user.user_metadata?.status || 'active';
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateUserStatus(user.id, newStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, user_metadata: { ...u.user_metadata, status: newStatus } }
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
                  ) : auditLogs.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--ash)' }}>Nenhum registo encontrado</td></tr>
                  ) : auditLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                      <td style={{ ...tdStyle, color: 'var(--ash)', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString('pt-PT')}</td>
                      <td style={tdStyle}>{log.admin_id?.slice(0, 8)}…</td>
                      <td style={tdStyle}>{log.target_id?.slice(0, 8)}…</td>
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
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--ash)' }}
                    >
                      Nenhum utilizador encontrado
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const loadedRole = user.app_metadata?.role || user.user_metadata?.role || 'dealer';
                    const currentStatus = user.user_metadata?.status || 'active';
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
        </Card>}
      </div>
    </AppLayout>
  );
}
