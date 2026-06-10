import LegalLayout from './LegalLayout';

const h2 = { fontSize: 16, fontWeight: 600, color: 'var(--bone)', marginTop: '1rem' };

export default function Terms() {
  return (
    <LegalLayout title="Termos de Serviço" updated="junho de 2026">
      <h2 style={h2}>1. O serviço</h2>
      <p>
        A Crivo é uma plataforma de inteligência de sourcing para revendedores automóveis em Portugal.
        Monitorizamos anúncios em marketplaces europeus, enviamos alertas com base nos critérios e margens
        configurados pelo utilizador e fornecemos estimativas do ISV (Imposto Sobre Veículos).
      </p>

      <h2 style={h2}>2. Conta</h2>
      <p>
        O registo destina-se a profissionais do setor automóvel. O utilizador é responsável por manter a
        confidencialidade das suas credenciais e por toda a atividade realizada na sua conta. Reservamo-nos
        o direito de suspender contas que violem estes termos ou que façam uso abusivo do serviço.
      </p>

      <h2 style={h2}>3. Pagamento</h2>
      <p>
        O serviço é disponibilizado por subscrição mensal de €99, com possibilidade de cancelamento a
        qualquer momento. O cancelamento produz efeitos no final do período de faturação em curso, sem
        reembolso proporcional do período já pago.
      </p>

      <h2 style={h2}>4. Estimativas e responsabilidade</h2>
      <p>
        Os cálculos de ISV, custos de transporte e margens apresentados são estimativas indicativas e não
        constituem aconselhamento fiscal, legal ou comercial. A decisão de compra de qualquer veículo é da
        exclusiva responsabilidade do utilizador. A Crivo não garante a exatidão, disponibilidade ou
        atualidade dos anúncios de terceiros monitorizados.
      </p>

      <h2 style={h2}>5. Rescisão</h2>
      <p>
        O utilizador pode eliminar a sua conta a qualquer momento nas Definições, o que remove
        permanentemente os seus dados. Podemos cessar o serviço com um pré-aviso razoável aos utilizadores
        com subscrição ativa.
      </p>

      <h2 style={h2}>6. Contacto</h2>
      <p>Para questões sobre estes termos: suporte@crivo.pt.</p>
    </LegalLayout>
  );
}
