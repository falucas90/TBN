import React, { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button } from '../components/ui';
import { FormField, CurrencyInput } from '../components/forms';
import { Save, Download, Trash2, Mail, Building } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/profilesService';

export default function Settings() {
  const { addToast } = useToast();
  const { currentUser } = useAuth();

  const [name, setName] = useState(currentUser?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.user_metadata?.phone || '');
  const [transportCost, setTransportCost] = useState(800);
  const [minMargin, setMinMargin] = useState(2000);
  const [notifChannel, setNotifChannel] = useState('WhatsApp');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);

  // Load profile from Supabase (falls back to defaults if not configured)
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

  async function handleSaveProfile() {
    if (!name.trim()) { addToast('O nome não pode estar vazio.', 'warn'); return; }
    setIsSavingProfile(true);
    try {
      await updateProfile({ fullName: name.trim(), phone });
      addToast('Perfil guardado com sucesso.', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao guardar perfil.', 'danger');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleSaveDefaults() {
    setIsSavingDefaults(true);
    try {
      await updateProfile({ defaultTransportCost: transportCost, minMargin, notifChannel });
      addToast('Definições padrão guardadas.', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao guardar definições.', 'danger');
    } finally {
      setIsSavingDefaults(false);
    }
  }

  const inputStyle = {
    height: '36px', padding: '0 12px', borderRadius: 'var(--r-md)',
    border: '1px solid var(--hairline)', fontSize: '13px', fontFamily: 'inherit',
    outline: 'none', width: '100%', boxSizing: 'border-box',
    background: 'var(--graphite)', color: 'var(--bone)',
  };

  return (
    <AppLayout>
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '500', letterSpacing: '-0.02em', marginBottom: '2rem' }}>Definições</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <Card>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Perfil da Conta</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <FormField label="Nome Completo" required>
                <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              </FormField>
              <FormField label="Nome da Empresa">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0' }}>
                  <Building size={18} style={{ color: 'var(--ash)' }} />
                  <span style={{ fontWeight: '500' }}>{currentUser?.user_metadata?.company || '—'}</span>
                </div>
              </FormField>
              <FormField label="Endereço de Email">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0' }}>
                  <Mail size={18} style={{ color: 'var(--ash)' }} />
                  <span style={{ fontWeight: '500' }}>{currentUser?.email}</span>
                </div>
              </FormField>
              <FormField label="Telefone / WhatsApp">
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+351 912 345 678" style={inputStyle} />
              </FormField>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                <Save size={16} /> {isSavingProfile ? 'A guardar…' : 'Guardar Alterações'}
              </Button>
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Padrões de Cálculo & Notificações</h2>
            <p style={{ color: 'var(--ash)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Configurações padrão usadas nos cálculos de margem quando não existem dados exatos.
            </p>
            <div style={{ maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FormField label="Custo de Transporte Padrão">
                <CurrencyInput value={transportCost} onChange={setTransportCost} />
              </FormField>
              <FormField label="Margem Mínima Alvo (Padrão)">
                <CurrencyInput value={minMargin} onChange={setMinMargin} />
              </FormField>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--hairline)' }}>
                <FormField label="Canal de Notificação Preferido">
                  <select value={notifChannel} onChange={e => setNotifChannel(e.target.value)} className="select">
                    <option>WhatsApp</option>
                    <option>Email</option>
                    <option>SMS</option>
                  </select>
                </FormField>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleSaveDefaults} disabled={isSavingDefaults}>
                <Save size={16} /> {isSavingDefaults ? 'A guardar…' : 'Guardar Padrões'}
              </Button>
            </div>
          </Card>

          <Card style={{ border: '1px solid var(--coral)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--coral)' }}>Zona de Perigo</h2>
            <p style={{ color: 'var(--ash)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Ações irreversíveis relacionadas com a sua conta e dados.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button variant="secondary" onClick={() => addToast('Exportação de dados iniciada.', 'info')}>
                <Download size={16} /> Exportar Dados (JSON)
              </Button>
              <Button variant="danger" onClick={() => addToast('Para eliminar a conta contacte suporte@crivo.pt', 'warn')}>
                <Trash2 size={16} /> Eliminar Conta
              </Button>
            </div>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
}
