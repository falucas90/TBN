import { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import PageTop from '../../components/layout/PageTop';
import { Btn, Icon, Pill, Seg } from '../../components/ui/Primitives';
import { inviteUser, listUsers, updateUserRole, updateUserStatus } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const PER_PAGE = 25;

export default function AdminStands() {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState('Todos');
  const [pendingRoles, setPendingRoles] = useState({});
  const [savingRows, setSavingRows] = useState({});
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCompany, setInviteCompany] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setUsers(null);
    listUsers({ page, perPage: PER_PAGE })
      .then(({ users: data, hasMore: more, total: count }) => {
        setUsers(data);
        setHasMore(more);
        setTotal(count);
        const initial = {};
        data.forEach((u) => { initial[u.id] = u.app_metadata?.role || u.user_metadata?.role || 'dealer'; });
        setPendingRoles(initial);
      })
      .catch(() => {
        addToast('Erro ao carregar utilizadores.', 'danger');
        setUsers([]);
      });
  }, [page, refreshKey, addToast]);

  async function handleInvite() {
    const email = inviteEmail.trim();
    if (!email.includes('@') || !email.includes('.')) {
      addToast('Introduza um endereço de email válido.', 'danger');
      return;
    }
    setIsInviting(true);
    try {
      await inviteUser(email, inviteCompany.trim() || undefined);
      addToast(`Convite enviado para ${email}.`, 'success');
      setInviteEmail('');
      setInviteCompany('');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      addToast(err.message || 'Erro ao enviar convite.', 'danger');
    } finally {
      setIsInviting(false);
    }
  }

  const statusOf = (u) => u.app_metadata?.status || u.user_metadata?.status || 'active';

  async function handleSaveRole(user) {
    const newRole = pendingRoles[user.id];
    const isSelfDemotion = user.id === currentUser?.id && newRole !== 'admin';
    setSavingRows((prev) => ({ ...prev, [user.id]: true }));
    try {
      await updateUserRole(user.id, newRole);
      setUsers((prev) => prev.map((u) =>
        u.id === user.id ? { ...u, app_metadata: { ...u.app_metadata, role: newRole }, user_metadata: { ...u.user_metadata, role: newRole } } : u
      ));
      addToast(isSelfDemotion
        ? 'Vai perder acesso de administrador no próximo início de sessão.'
        : 'Função do utilizador atualizada.', isSelfDemotion ? 'warn' : 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao atualizar função.', 'danger');
    } finally {
      setSavingRows((prev) => ({ ...prev, [user.id]: false }));
    }
  }

  async function handleToggleStatus(user) {
    const newStatus = statusOf(user) === 'active' ? 'inactive' : 'active';
    if (user.id === currentUser?.id && newStatus !== 'active') {
      addToast('Não pode desativar a sua própria conta.', 'warn');
      return;
    }
    try {
      await updateUserStatus(user.id, newStatus);
      setUsers((prev) => prev.map((u) =>
        u.id === user.id ? { ...u, app_metadata: { ...u.app_metadata, status: newStatus } } : u
      ));
      addToast(newStatus === 'active' ? 'Conta desbloqueada.' : 'Conta bloqueada.', newStatus === 'active' ? 'success' : 'warn');
    } catch (err) {
      addToast(err.message || 'Erro ao atualizar estado.', 'danger');
    }
  }

  const q = query.trim().toLowerCase();
  const shown = (users ?? [])
    .filter((u) => {
      if (!q) return true;
      const name = u.user_metadata?.full_name || u.user_metadata?.name || '';
      const company = u.user_metadata?.company || '';
      return (name + ' ' + company + ' ' + (u.email || '')).toLowerCase().includes(q);
    })
    .filter((u) => view === 'Todos' || (view === 'Ativos' ? statusOf(u) === 'active' : statusOf(u) !== 'active'));

  return (
    <AppLayout>
      <div className="page">
        <PageTop
          title="Stands"
          sub={total != null ? `${total} contas registadas` : 'Contas de revendedores na plataforma'}
          right={<>
            <Seg options={['Todos', 'Ativos', 'Atenção']} value={view} onChange={setView} />
            <div className="input-group" style={{ width: 220 }}>
              <Icon name="search" size={14} />
              <input className="input" placeholder="Procurar stand ou contacto" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </>}
        />
        <div className="page__body" style={{ overflowY: 'auto', padding: '8px 32px 24px' }}>
          <div className="row gap-2" style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 12.5, fontWeight: 500 }}>Convidar stand</span>
            <input
              className="input"
              type="email"
              style={{ width: 240 }}
              placeholder="email@stand.pt"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleInvite(); }}
              disabled={isInviting}
            />
            <input
              className="input"
              style={{ width: 200 }}
              placeholder="Nome do stand (opcional)"
              value={inviteCompany}
              onChange={(e) => setInviteCompany(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleInvite(); }}
              disabled={isInviting}
            />
            <Btn size="sm" variant="primary" onClick={handleInvite} disabled={isInviting}>
              {isInviting ? 'A enviar…' : 'Enviar convite'}
            </Btn>
          </div>
          <table className="t">
            <thead>
              <tr>
                <th>Stand</th><th>Plano</th><th>Função</th><th>Estado</th><th></th>
              </tr>
            </thead>
            <tbody>
              {users === null ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    <td colSpan={5}>
                      <div style={{ height: 16, background: 'var(--slate)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
                    </td>
                  </tr>
                ))
              ) : shown.map((u) => {
                const blocked = statusOf(u) !== 'active';
                const displayName = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || '—';
                const company = u.user_metadata?.company;
                const loadedRole = u.app_metadata?.role || u.user_metadata?.role || 'dealer';
                const pendingRole = pendingRoles[u.id] ?? loadedRole;
                const isDirty = pendingRole !== loadedRole;
                const isSaving = !!savingRows[u.id];
                return (
                  <tr key={u.id}>
                    <td>
                      {/* Stand name comes from user_metadata.company. When absent,
                          show '—' rather than the contact's name, which would
                          misleadingly read as the stand name. */}
                      <div style={{ fontWeight: 500, color: company ? undefined : 'var(--dust)' }}>{company || '—'}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--dust)' }}>{displayName}{displayName !== u.email && u.email ? ` · ${u.email}` : ''}</div>
                    </td>
                    <td><Pill mono>{u.user_metadata?.plan || 'Pro'}</Pill></td>
                    <td>
                      <div className="row gap-2">
                        <select
                          className="select"
                          style={{ width: 110 }}
                          value={pendingRole}
                          onChange={(e) => setPendingRoles((prev) => ({ ...prev, [u.id]: e.target.value }))}
                        >
                          <option value="dealer">Dealer</option>
                          <option value="admin">Admin</option>
                        </select>
                        {isDirty && (
                          <Btn size="sm" variant="primary" onClick={() => handleSaveRole(u)} disabled={isSaving}>
                            {isSaving ? '…' : 'Guardar'}
                          </Btn>
                        )}
                      </div>
                    </td>
                    <td><Pill tone={blocked ? 'coral' : 'emerald'}>{blocked ? 'Bloqueado' : 'Ativo'}</Pill></td>
                    <td className="num">
                      <Btn size="sm" variant={blocked ? 'default' : 'danger'} onClick={() => handleToggleStatus(u)}>
                        {blocked ? 'Desbloquear' : 'Bloquear'}
                      </Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users !== null && shown.length === 0 && (
            <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--dust)' }}>
              {q ? `Sem resultados para “${query}”.` : 'Sem contas para mostrar.'}
            </div>
          )}
          <div className="row" style={{ justifyContent: 'space-between', paddingTop: 16 }}>
            <Btn variant="ghost" size="sm" disabled={page === 1 || users === null} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Anterior
            </Btn>
            <span style={{ color: 'var(--dust)', fontSize: 12 }}>
              {total != null ? `Página ${page} de ${Math.max(1, Math.ceil(total / PER_PAGE))}` : `Página ${page}`}
            </span>
            <Btn variant="ghost" size="sm" disabled={!hasMore || users === null} onClick={() => setPage((p) => p + 1)}>
              Seguinte
            </Btn>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
