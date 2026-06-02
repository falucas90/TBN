import React from 'react';
import { Btn, Switch } from '../components/ui/Primitives';

export default function Settings() {
  const [whatsappEnabled, setWhatsappEnabled] = React.useState(true);
  const [emailEnabled, setEmailEnabled] = React.useState(false);

  return (
    <div className="page">
      <div className="page__top">
        <div>
          <h1 className="page__title">Definições</h1>
          <p className="page__sub">Gerir conta, alertas e preferências</p>
        </div>
      </div>

      <div className="page__body">
        <div className="settings">
          
          <div className="settings-section">
            <h3 className="settings-section__title">Perfil do Stand</h3>
            <div className="settings-row">
              <div>
                <div className="settings-row__label">Nome da Empresa</div>
                <div className="settings-row__desc">Nome público que aparece nos relatórios</div>
              </div>
              <input type="text" className="input" defaultValue="Stand Marques" style={{ width: '280px' }} />
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row__label">Email Principal</div>
                <div className="settings-row__desc">Para login e faturação</div>
              </div>
              <input type="email" className="input" defaultValue="francisco@standmarques.pt" style={{ width: '280px' }} />
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section__title">Notificações e Alertas</h3>
            <div className="settings-row">
              <div>
                <div className="settings-row__label">Alertas por WhatsApp</div>
                <div className="settings-row__desc">Receba notificações instantâneas no seu telemóvel</div>
              </div>
              <div className="row gap-4">
                <input type="text" className="input num" defaultValue="+351 912 345 678" style={{ width: '160px' }} />
                <Switch checked={whatsappEnabled} onChange={setWhatsappEnabled} />
              </div>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row__label">Resumo Diário por Email</div>
                <div className="settings-row__desc">Email às 08:00 com as melhores oportunidades do dia anterior</div>
              </div>
              <Switch checked={emailEnabled} onChange={setEmailEnabled} />
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section__title">Parâmetros de Cálculo</h3>
            <div className="settings-row">
              <div>
                <div className="settings-row__label">Custo Fixo de Transporte Fixo (€)</div>
                <div className="settings-row__desc">Custo médio para importar um veículo da Europa Central</div>
              </div>
              <input type="number" className="input num" defaultValue="650" style={{ width: '120px' }} />
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row__label">Custos de Legalização (€)</div>
                <div className="settings-row__desc">Inspeção B, chapas, registo (excluindo ISV)</div>
              </div>
              <input type="number" className="input num" defaultValue="250" style={{ width: '120px' }} />
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section__title" style={{ color: 'var(--coral)' }}>Zona de Perigo</h3>
            <div className="settings__danger">
              <div className="settings-row" style={{ padding: 0 }}>
                <div>
                  <div className="settings-row__label" style={{ color: 'var(--coral)', fontWeight: 500 }}>Cancelar Subscrição</div>
                  <div className="settings-row__desc" style={{ maxWidth: '360px' }}>
                    A sua subscrição será cancelada no final do período de faturação atual.
                    Perderá acesso a todas as pesquisas ativas.
                  </div>
                </div>
                <Btn variant="danger">Cancelar Subscrição</Btn>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
