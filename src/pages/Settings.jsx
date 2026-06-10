import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PageTop from '../components/layout/PageTop';
import { Btn, Pill, Dot, Switch } from '../components/ui/Primitives';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/profilesService';
import { exportUserData, deleteAccount } from '../services/authService';

export default function Settings() {
  const { addToast } = useToast();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

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

  useEffect(() => {
    getProfile().then(profile => {
      if (!profile) return;
      if (profile.fullName) setName(profile.fullName);
      if (profile.phone) setPhone(profile.phone);
      setTransportCost(profile.defaultTransportCost);
      setMinMargin(profile.minMargin);
      setNotifChannel(profile.notifChannel);
    }).catch(() => {});
  }, []);

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

  async function saveDefaults() {
    try {
      await updateProfile({ defaultTransportCost: transportCost, minMargin, notifChannel });
      addToast('Definições padrão guardadas.', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao guardar definições.', 'danger');
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
    const confirmed = window.confirm(
      'Tem a certeza que quer eliminar a sua conta? Todos os dados (pesquisas, alertas, perfil) serão permanentemente apagados. Esta ação é irreversível.'
    );
    if (!confirmed) return;
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

  const company = currentUser?.user_metadata?.company;
  const nif = currentUser?.user_metadata?.nif;

  return (
    <AppLayout>
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
              <div className="settings__row">
                <div>
                  <div className="settings__row-label">Empresa</div>
                  <div className="settings__row-desc">{company ? `${company}${nif ? ` · NIF ${nif}` : ''}` : '—'}</div>
                </div>
              </div>
            </section>

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
                  <div className="settings__row-desc">Usado quando o anúncio não tem custo de transporte.</div>
                </div>
                <input className="input tnum" type="number" style={{ width: 120 }} value={transportCost} onChange={e => setTransportCost(Number(e.target.value))} onBlur={saveDefaults} />
              </div>
              <div className="settings__row">
                <div>
                  <div className="settings__row-label">Margem mínima alvo</div>
                  <div className="settings__row-desc">Limiar padrão para novas pesquisas.</div>
                </div>
                <input className="input tnum" type="number" style={{ width: 120 }} value={minMargin} onChange={e => setMinMargin(Number(e.target.value))} onBlur={saveDefaults} />
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
              <div style={{ padding: 20, background: 'var(--graphite)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="settings__row-label">Plano Pro · € 49 / mês</div>
                    <Pill tone="emerald">Ativa</Pill>
                  </div>
                  <div className="settings__row-desc">Pagamento processado pela Stripe.</div>
                </div>
                <Btn variant="ghost" size="sm" onClick={() => addToast('Portal de pagamento em breve.', 'info')}>Gerir pagamento</Btn>
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
                  <Btn variant="danger" size="sm" onClick={handleDeleteAccount} disabled={isDeleting}>
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
