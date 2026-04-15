import React, { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button, StatCard, Toggle } from '../components/ui';
import { FormField, CurrencyInput } from '../components/forms';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export default function CreateSearch() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState({
    whatsapp: true,
    email: false,
    sms: false
  });
  const [alertThreshold, setAlertThreshold] = useState(3000);
  const [dailySummary, setDailySummary] = useState(true);
  const [minMargin, setMinMargin] = useState(2500);
  
  const [countries, setCountries] = useState({
    germany: true,
    france: false,
    netherlands: false,
    belgium: false,
    spain: false
  });

  const handleLaunch = () => {
    addToast('Nova pesquisa iniciada com sucesso.', 'success');
    navigate('/searches');
  };

  const handleSaveDraft = () => {
    addToast('Pesquisa guardada nos rascunhos.', 'info');
    navigate('/searches');
  };

  return (
    <AppLayout>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
         
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.25rem' }}>Criar Nova Pesquisa</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Configure os critérios, origens e limites de alerta.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button variant="secondary" onClick={handleSaveDraft}>Guardar Rascunho</Button>
            <Button onClick={handleLaunch}>Iniciar Pesquisa</Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(500px, 1fr) 350px', gap: '2rem', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Form sections */}
            <Card>
               <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>1. Critérios do Veículo</h2>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                 <FormField label="Marca" required>
                   <select style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }}>
                     <option>Selecionar Marca</option>
                     <option>BMW</option>
                     <option>Renault</option>
                     <option>Mercedes-Benz</option>
                     <option>Audi</option>
                   </select>
                 </FormField>
                 <FormField label="Modelo" required>
                   <select style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }}>
                     <option>Selecionar Modelo</option>
                     <option>Série 3</option>
                     <option>Classe A</option>
                     <option>Megane</option>
                   </select>
                 </FormField>
                 
                 {/* Year Min/Max */}
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                   <FormField label="Ano Mín">
                     <input type="number" defaultValue="2018" style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }} />
                   </FormField>
                   <FormField label="Ano Máx">
                     <input type="number" defaultValue="2024" style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }} />
                   </FormField>
                 </div>

                 {/* Mileage Min/Max */}
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                   <FormField label="KMs Mín">
                     <input type="number" defaultValue="0" style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }} />
                   </FormField>
                   <FormField label="KMs Máx">
                     <input type="number" defaultValue="100000" style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }} />
                   </FormField>
                 </div>

                 {/* Price Min/Max */}
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                   <FormField label="Preço Mín (€)">
                     <input type="number" defaultValue="0" style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }} />
                   </FormField>
                   <FormField label="Preço Máx (€)">
                     <input type="number" defaultValue="30000" style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }} />
                   </FormField>
                 </div>

                 {/* Classic Metrics */}
                 <FormField label="Combustível">
                   <select style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }}>
                     <option>Todos</option>
                     <option>Diesel</option>
                     <option>Gasolina</option>
                     <option>Elétrico</option>
                     <option>Híbrido (PHEV)</option>
                   </select>
                 </FormField>
                 
                 <FormField label="Caixa">
                   <select style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }}>
                     <option>Todas</option>
                     <option>Automática</option>
                     <option>Manual</option>
                   </select>
                 </FormField>

                 <FormField label="Carroçaria">
                   <select style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }}>
                     <option>Todas</option>
                     <option>Carrinha (Station)</option>
                     <option>Sedan</option>
                     <option>SUV</option>
                   </select>
                 </FormField>

               </div>
            </Card>

            <Card>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>2. Países de Origem</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {Object.entries({
                  germany: 'Alemanha', france: 'França', netherlands: 'Holanda', belgium: 'Bélgica', spain: 'Espanha'
                }).map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={countries[key]} 
                      onChange={(e) => setCountries(c => ({...c, [key]: e.target.checked}))} 
                      style={{ width: '1.125rem', height: '1.125rem', accentColor: 'var(--color-primary-teal)' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{label}</span>
                  </label>
                ))}
              </div>
            </Card>

            <Card>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>3. Margem e Notificações</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <FormField label="Margem Mínima Esperada">
                  <CurrencyInput value={minMargin} onChange={setMinMargin} />
                </FormField>
                <FormField label="Referência de Mercado (Baseline)">
                  <select style={{ padding: '0.625rem', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', outline: 'none' }}>
                     <option>Standvirtual (Média)</option>
                   </select>
                </FormField>
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 
                 <div>
                   <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem' }}>Alertas Instantâneos</h3>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                     <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Disparar quando a margem for superior a:</span>
                     <div style={{ width: '120px' }}>
                       <CurrencyInput value={alertThreshold} onChange={setAlertThreshold} />
                     </div>
                   </div>
                   
                   <div style={{ display: 'flex', gap: '1.5rem' }}>
                     <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                       <input type="checkbox" checked={alerts.whatsapp} onChange={e => setAlerts(a => ({...a, whatsapp: e.target.checked}))}/> WhatsApp
                     </label>
                     <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                       <input type="checkbox" checked={alerts.email} onChange={e => setAlerts(a => ({...a, email: e.target.checked}))}/> Email
                     </label>
                     <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                       <input type="checkbox" checked={alerts.sms} onChange={e => setAlerts(a => ({...a, sms: e.target.checked}))}/> SMS
                     </label>
                   </div>
                 </div>

                 <Toggle label="Enviar Resumo Diário por Email" checked={dailySummary} onChange={setDailySummary} />
              </div>
            </Card>
          </div>

          <div style={{ position: 'sticky', top: '2rem' }}>
             <Card style={{ backgroundColor: 'var(--color-bg-page)', border: 'none' }}>
               <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>Dimensão da Audiência</h3>
               <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                 Com base nos anúncios atuais, aqui está o número de carros que correspondem aos seus critérios em bruto antes dos cálculos de margem.
               </p>
               <StatCard label="Anúncios Ativos Estimados" value="48" icon={null} />
               <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--color-text-secondary)' }}>Resultados na Alemanha</span>
                   <span style={{ fontWeight: '500' }}>32</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--color-text-secondary)' }}>Resultados na França</span>
                   <span style={{ fontWeight: '500' }}>16</span>
                 </div>
               </div>
               <Button fullWidth style={{ marginTop: '2rem' }} onClick={handleLaunch}>Iniciar Pesquisa</Button>
             </Card>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
