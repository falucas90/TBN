import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PageTop from '../components/layout/PageTop';
import { Btn, Pill, Dot, Switch } from '../components/ui/Primitives';
import { ConfirmDialog } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/profilesService';
import { getCompany, updateCompany } from '../services/companiesService';
import { listMembers, inviteMember, updateMemberRole, removeMember } from '../services/teamService';
import { exportUserData, deleteAccount } from '../services/authService';

export default function Settings() {
  const { addToast } = useToast();
  const { currentUser, companyRole, logout } = useAuth();
  const navigate = useNavigate();
  const isOwner = companyRole === 'owner';

  const [name, setName] = useState(currentUser?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.user_metadata?.phone || '');
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [quiet, setQuiet] = useState(true);
  const [transportCost, setTransportCost] = useState(800);
  const [minMargin, setMinMargin] = useState(2000);
  const [notifChannel, setNotifChannel] = useState('WhatsApp');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  // Company (stand) — business identity and calculation defaults
  const [company, setCompany] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyNif, setCompanyNif] = useState('');
  const [editingCompany, setEditingCompany] = useState(false);

  // Team — owner-only management
  const [members, setMembers] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState(null);

  useEffect(() => {
    getProfile().then(profile => {
      if (!profile) return;
      if (profile.fullName) setName(profile.fullName);
      if (profile.phone) setPhone(profile.phone);
      setNotifChannel(profile.notifChannel);
    }).catch(() => {});
    getCompany().then(c => {
      if (!c) return;
      setCompany(c);
      setCompanyName(c.name || '');
      setCompanyNif(c.nif || '');
      setTransportCost(c.defaultTransportCost);
      setMinMargin(c.minMargin);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOwner) return;
    listMembers().then(setMembers).catch(() => setMembers([]));
  }, [isOwner]);

  async function saveName() {
    if (!name.trim()) { addToast('O nome não pode estar vazio.', 'warn'); return; }
    try {
      await updateProfile({ fullName: name.trim(), phone });
      addToast('Perfil guardado.', 'success');
      setEditingName(false);
    } catch (err) {
      addToast(err.message || 'Erro ao guardar perfil.', 'danger');
    }
  }

  async function savePhone() {
    try {
      await updateProfile({ fullName: name.trim(), phone });
      addToast('Número guardado.', 'success');
      setEditingPhone(false);
    } catch (err) {
      addToast(err.message || 'Erro ao guardar número.', 'danger');
    }
  }

  async function saveCompany() {
    if (!companyName.trim()) { addToast('O nome da empresa não pode estar vazio.', 'warn'); return; }
    try {
      const updated = await updateCompany(company.id, {
        name: companyName.trim(),
        nif: companyNif.trim() || null,
      });
      setCompany(updated);
      setEditingCompany(false);
      addToast('Dados da empresa guardados.', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao guardar dados da empresa.', 'danger');
    }
  }

  async function saveDefaults() {
    try {
      if (isOwner && company) {
        await updateCompany(company.id, { defaultTransportCost: transportCost, minMargin });
      }
      await updateProfile({ notifChannel });
      addToast('Definições padrão guardadas.', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao guardar definições.', 'danger');
    }
  }

  async function handleInviteMember() {
    const email = inviteEmail.trim();
    if (!email.includes('@') || !email.includes('.')) {
      addToast('Introduza um endereço de email válido.', 'danger');
      return;
    }
    setIsInviting(true);
    try {
      await inviteMember(email);
      addToast(`Convite enviado para ${email}.`, 'success');
      setInviteEmail('');
      setMembers(await listMembers());
    } catch (err) {
      addToast(err.message || 'Erro ao enviar convite.', 'danger');
    } finally {
      setIsInviting(false);
    }
  }

  async function handleMemberRole(member, newRole) {
    try {
      await updateMemberRole(member.id, newRole);
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, companyRole: newRole } : m));
      addToast('Função atualizada.', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao atualizar função.', 'danger');
    }
  }

  async function handleRemoveMember() {
    const member = confirmRemoveMember;
    setConfirmRemoveMember(null);
    if (!member) return;
    try {
      await removeMember(member.id);
      setMembers(prev => prev.filter(m => m.id !== member.id));
      addToast('Membro removido da equipa.', 'warn');
    } catch (err) {
      addToast(err.message || 'Erro ao remover membro.', 'danger');
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crivo-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Dados exportados com sucesso.', 'success');
    } catch {
      addToast('Erro ao exportar dados.', 'danger');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setConfirmDeleteAccount(false);
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch {
      addToast('Erro ao eliminar conta. Contacte suporte@crivo.pt.', 'danger');
      setIsDeleting(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <AppLayout>
      <ConfirmDialog
        open={confirmDeleteAccount}
        title="Eliminar conta"
        description="Todos os dados (pesquisas, alertas, perfil) serão permanentemente apagados. Esta ação é irreversível."
        confirmLabel="Eliminar conta"
        danger
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDeleteAccount(false)}
      />
      <ConfirmDialog
        open={!!confirmRemoveMember}
        title="Remover membro"
        description={`${confirmRemoveMember?.email || 'Este utilizador'} perde o acesso ao stand e a conta é desativada.`}
        confirmLabel="Remover"
        danger
        onConfirm={handleRemoveMember}
        onCancel={() => setConfirmRemoveMember(null)}
      />
      <div className="page">
        <PageTop
          title="Definições"
          right={<Btn variant="ghost" onClick={handleLogout}>Terminar sessão</Btn>}
        />
        <div className="page__body">
          <div className="settings">
            <section className="settings__section">
              <div className="settings__section-title">Conta</div>
              <div className="settings__row">
                <div style={{ flex: 1 }}>
                  <div className="settings__row-label">Nome</div>
                  {editingName ? (
                    <div className="row gap-2" style={{ marginTop: 8, maxWidth: 360 }}>
                      <input className="input" value={name} onChange={e => setName(e.target.value)} />
                      <Btn variant="primary" size="sm" onClick={saveName}>Guardar</Btn>
                    </div>
                  ) : (
                    <div className="settings__row-desc">{name || '—'}</div>
                  )}
                </div>
                {!editingName && <Btn variant="ghost" size="sm" onClick={() => setEditingName(true)}>Editar</Btn>}
              </div>
              <div className="settings__row">
                <div>
                  <div className="settings__row-label">Email</div>
                  <div className="settings__row-desc">{currentUser?.email || '—'}</div>
                </div>
              </div>
            </section>

            <section className="settings__section">
              <div className="settings__section-title">Empresa</div>
              <div className="settings__row">
                <div style={{ flex: 1 }}>
                  <div className="settings__row-label">Stand</div>
                  {editingCompany ? (
                    <div className="row gap-2" style={{ marginTop: 8, maxWidth: 480 }}>
                      <input className="input" placeholder="Nome do stand" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                      <input className="input" placeholder="NIF" style={{ width: 140 }} value={companyNif} onChange={e => setCompanyNif(e.target.value)} />
                      <Btn variant="primary" size="sm" onClick={saveCompany}>Guardar</Btn>
                    </div>
                  ) : (
                    <div className="settings__row-desc">
                      {company ? `${company.name}${company.nif ? ` · NIF ${company.nif}` : ''}` : '—'}
                    </div>
                  )}
                </div>
                <div className="row gap-2">
                  <Pill mono>{isOwner ? 'Responsável' : 'Membro'}</Pill>
                  {isOwner && !editingCompany && company && (
                    <Btn variant="ghost" size="sm" onClick={() => setEditingCompany(true)}>Editar</Btn>
                  )}
                </div>
              </div>
            </section>

            {isOwner && (
              <section className="settings__section">
                <div className="settings__section-title">Equipa</div>
                <div className="settings__row">
                  <div style={{ flex: 1 }}>
                    <div className="settings__row-label">Convidar membro</div>
                    <div className="settings__row-desc">O convidado entra no stand e partilha pesquisas e alertas.</div>
                  </div>
                  <div className="row gap-2">
                    <input
                      className="input"
                      type="email"
                      style={{ width: 240 }}
                      placeholder="email@stand.pt"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleInviteMember(); }}
                      disabled={isInviting}
                    />
                    <Btn size="sm" variant="primary" onClick={handleInviteMember} disabled={isInviting}>
                      {isInviting ? 'A enviar…' : 'Convidar'}
                    </Btn>
                  </div>
                </div>
                {(members ?? []).map(member => {
                  const isSelf = member.id === currentUser?.id;
                  return (
                    <div className="settings__row" key={member.id}>
                      <div>
                        <div className="settings__row-label">{member.fullName || member.email || '—'}</div>
                        <div className="settings__row-desc">
                          {member.email}{member.status !== 'active' ? ' · conta bloqueada' : ''}
                        </div>
                      </div>
                      {isSelf ? (
                        <Pill tone="emerald"><Dot tone="emerald" />Responsável (você)</Pill>
                      ) : (
                        <div className="row gap-2">
                          <select
                            className="select"
                            style={{ width: 140 }}
                            value={member.companyRole}
                            onChange={e => handleMemberRole(member, e.target.value)}
                          >
                            <option value="owner">Responsável</option>
                            <option value="member">Membro</option>
                          </select>
                          <Btn size="sm" variant="danger" onClick={() => setConfirmRemoveMember(member)}>Remover</Btn>
                        </div>
                      )}
                    </div>
                  );
                })}
                {members !== null && members.length === 0 && (
                  <div className="settings__row">
                    <div className="settings__row-desc">Ainda sem membros na equipa.</div>
                  </div>
                )}
              </section>
            )}

            <section className="settings__section">
              <div className="settings__section-title">WhatsApp</div>
              <div className="settings__row">
                <div style={{ flex: 1 }}>
                  <div className="settings__row-label">Número verificado</div>
                  {editingPhone ? (
                    <div className="row gap-2" style={{ marginTop: 8, maxWidth: 360 }}>
                      <input className="input" placeholder="+351 912 345 678" value={phone} onChange={e => setPhone(e.target.value)} />
                      <Btn variant="primary" size="sm" onClick={savePhone}>Guardar</Btn>
                    </div>
                  ) : (
                    <div className="settings__row-desc">{phone ? `${phone} · os alertas vão para este número.` : 'Sem número configurado.'}</div>
                  )}
                </div>
                {!editingPhone && (phone
                  ? <div className="row gap-2"><Pill tone="emerald"><Dot tone="emerald" />Verificado</Pill><Btn variant="ghost" size="sm" onClick={() => setEditingPhone(true)}>Alterar</Btn></div>
                  : <Btn variant="ghost" size="sm" onClick={() => setEditingPhone(true)}>Adicionar</Btn>)}
              </div>
              <div className="settings__row">
                <div>
                  <div className="settings__row-label">Janela silenciosa</div>
                  <div className="settings__row-desc">Não receber alertas entre as 21:00 e 08:00.</div>
                </div>
                <Switch checked={quiet} onChange={setQuiet} />
              </div>
            </section>

            <section className="settings__section">
              <div className="settings__section-title">Padrões de cálculo</div>
              <div className="settings__row">
                <div>
                  <div className="settings__row-label">Custo de transporte padrão</div>
                  <div className="settings__row-desc">
                    {isOwner ? 'Usado quando o anúncio não tem custo de transporte. Aplica-se a todo o stand.' : 'Definido pelo responsável do stand.'}
                  </div>
                </div>
                <input className="input tnum" type="number" style={{ width: 120 }} value={transportCost} onChange={e => setTransportCost(Number(e.target.value))} onBlur={saveDefaults} disabled={!isOwner} />
              </div>
              <div className="settings__row">
                <div>
                  <div className="settings__row-label">Margem mínima alvo</div>
                  <div className="settings__row-desc">
                    {isOwner ? 'Limiar padrão para novas pesquisas. Aplica-se a todo o stand.' : 'Definido pelo responsável do stand.'}
                  </div>
                </div>
                <input className="input tnum" type="number" style={{ width: 120 }} value={minMargin} onChange={e => setMinMargin(Number(e.target.value))} onBlur={saveDefaults} disabled={!isOwner} />
              </div>
              <div className="settings__row">
                <div>
                  <div className="settings__row-label">Canal de notificação preferido</div>
                  <div className="settings__row-desc">Onde recebe os alertas instantâneos.</div>
                </div>
                <select className="select" style={{ width: 140 }} value={notifChannel} onChange={e => { setNotifChannel(e.target.value); }} onBlur={saveDefaults}>
                  <option>WhatsApp</option>
                  <option>Email</option>
                  <option>SMS</option>
                </select>
              </div>
            </section>

            <section className="settings__section">
              <div className="settings__section-title">Subscrição</div>
              <div style={{ padding: 20, background: 'var(--graphite)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="settings__row-label">Beta gratuita</div>
                  <Pill tone="emerald">Sem faturação</Pill>
                </div>
                <div className="settings__row-desc" style={{ marginTop: 4 }}>Sem custos durante a beta. Sem cartão associado, sem faturas.</div>
              </div>
            </section>

            <section className="settings__section">
              <div className="settings__section-title">Zona de perigo</div>
              <div className="settings__danger">
                <div className="settings__row" style={{ paddingTop: 0 }}>
                  <div>
                    <div className="settings__row-label">Exportar dados</div>
                    <div className="settings__row-desc">Descarrega pesquisas, alertas e perfil em JSON.</div>
                  </div>
                  <Btn variant="ghost" size="sm" onClick={handleExport} disabled={isExporting}>
                    {isExporting ? 'A exportar…' : 'Exportar'}
                  </Btn>
                </div>
                <div className="settings__row" style={{ paddingBottom: 0 }}>
                  <div>
                    <div className="settings__row-label">Eliminar conta</div>
                    <div className="settings__row-desc">Todos os dados são permanentemente apagados.</div>
                  </div>
                  <Btn variant="danger" size="sm" onClick={() => setConfirmDeleteAccount(true)} disabled={isDeleting}>
                    {isDeleting ? 'A eliminar…' : 'Eliminar'}
                  </Btn>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
