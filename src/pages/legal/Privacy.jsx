import LegalLayout from './LegalLayout';

const h2 = { fontSize: 16, fontWeight: 600, color: 'var(--bone)', marginTop: '1rem' };

export default function Privacy() {
  return (
    <LegalLayout title="Política de Privacidade" updated="junho de 2026">
      <h2 style={h2}>1. Dados que recolhemos</h2>
      <p>
        Quando cria uma conta, recolhemos o seu nome, endereço de email, nome da empresa, NIF e número de
        telefone. Durante a utilização do serviço, guardamos as pesquisas que configura, os alertas gerados
        e as suas preferências (custos de transporte, margens e canais de notificação).
      </p>

      <h2 style={h2}>2. Finalidade e base legal</h2>
      <p>
        Tratamos estes dados para prestar o serviço contratado (execução de contrato, art. 6.º, n.º 1,
        alínea b) do RGPD): enviar alertas pelos canais que escolheu, calcular estimativas e gerir a sua
        conta e subscrição. Não vendemos dados pessoais nem os utilizamos para publicidade de terceiros.
      </p>

      <h2 style={h2}>3. Subcontratantes</h2>
      <p>
        Os dados são alojados na Supabase (infraestrutura na União Europeia). Os canais de notificação
        (email, WhatsApp) implicam a transmissão do conteúdo do alerta ao respetivo fornecedor.
      </p>

      <h2 style={h2}>4. Retenção</h2>
      <p>
        Conservamos os seus dados enquanto a conta estiver ativa. Quando elimina a conta, os dados pessoais,
        pesquisas e alertas são apagados permanentemente.
      </p>

      <h2 style={h2}>5. Os seus direitos</h2>
      <p>
        Tem direito de acesso, retificação, portabilidade, oposição e apagamento. Pode exportar todos os
        seus dados (JSON) e eliminar a conta de forma autónoma em Definições → Zona de Perigo. Para
        exercer outros direitos, ou para reclamações, contacte-nos; pode igualmente apresentar reclamação à
        CNPD (Comissão Nacional de Proteção de Dados).
      </p>

      <h2 style={h2}>6. Contacto</h2>
      <p>Responsável pelo tratamento: Crivo — suporte@crivo.pt.</p>
    </LegalLayout>
  );
}
