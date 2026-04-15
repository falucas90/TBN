import React, { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button } from '../components/ui';
import { FormField, CurrencyInput } from '../components/forms';
import { mockUser } from '../data/mock-data';
import { Save, Download, Trash2, Mail, Building } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { addToast } = useToast();
  const [transportCost, setTransportCost] = useState(mockUser.defaultTransportCost);
  const [minMargin, setMinMargin] = useState(2000);

  return (
    <AppLayout>
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '2rem' }}>Definições</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <Card>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Perfil da Conta</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <FormField label="Nome Completo">
                <input type="text" defaultValue={mockUser.name} style={{
                  padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none'
                }} />
              </FormField>
              <FormField label="Nome da Empresa">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0' }}>
                  <Building size={18} style={{ color: 'var(--color-text-secondary)' }} />
                  <span style={{ fontWeight: '500' }}>{mockUser.company}</span>
                </div>
              </FormField>
              <FormField label="Endereço de Email">
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0' }}>
                  <Mail size={18} style={{ color: 'var(--color-text-secondary)' }} />
                  <span style={{ fontWeight: '500' }}>{mockUser.email}</span>
                </div>
              </FormField>
              <FormField label="Telefone / WhatsApp">
                <input type="text" defaultValue="+351 912 345 678" style={{
                  padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none'
                }} />
              </FormField>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => addToast('Alterações de perfil guardadas com sucesso.', 'success')}><Save size={16} /> Guardar Alterações</Button>
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Padrões de Cálculo & Notificações</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Defina as configurações padrão a serem usadas na aplicação caso não existam dados exatos.
            </p>
            <div style={{ maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FormField label="Custo de Transporte Padrão">
                <CurrencyInput value={transportCost} onChange={setTransportCost} />
              </FormField>
              <FormField label="Margem Mínima Alvo (Padrão)">
                <CurrencyInput value={minMargin} onChange={setMinMargin} />
              </FormField>
              
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <FormField label="Canal de Notificação Preferido">
                  <select style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }}>
                    <option>WhatsApp</option>
                    <option>Email</option>
                    <option>SMS</option>
                  </select>
                </FormField>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => addToast('Definições padrão guardadas.', 'success')}><Save size={16} /> Guardar Padrões</Button>
            </div>
          </Card>

          <Card style={{ border: '1px solid var(--color-danger-text)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-danger-text)' }}>Zona de Perigo</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Ações irreversíveis relacionadas com a sua conta e os seus dados.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button variant="secondary" onClick={() => addToast('Exportação de dados iniciada.', 'info')}><Download size={16} /> Exportar Dados (JSON)</Button>
              <Button variant="danger" onClick={() => addToast('Tem a certeza? Esta ação requer confirmação.', 'error')}><Trash2 size={16} /> Eliminar Conta</Button>
            </div>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
}
