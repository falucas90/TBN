import { Icon } from './Primitives';

/* WhatsApp alert card mock — hero visual on the website, alert preview in the app */
export default function WhatsAppCard() {
  return (
    <div className="wa-card">
      <div className="wa-card__head">
        <Icon name="sparkle" size={11} color="var(--emerald)" strokeWidth={1.5} />
        <span>Crivo · Alerta</span>
        <span style={{ marginLeft: 'auto', color: 'var(--dust)' }}>09:42</span>
      </div>
      <div>
        <div className="wa-card__title">BMW 320d Touring · 2019 · 128 000 km</div>
        <div className="wa-card__specs">Mobile.de · Munique · ★ Vendedor verificado</div>
      </div>
      <div className="wa-card__price">
        <span className="label">Anúncio</span>
        <span></span>
        <span className="val">€ 18 400</span>
        <span className="label">Landed PT</span>
        <span></span>
        <span className="val">€ 23 120</span>
        <span className="label">Margem est.</span>
        <span></span>
        <span className="val val-emerald">+ € 3 280</span>
      </div>
      <span className="wa-card__cta">Abrir anúncio →</span>
      <div className="wa-card__footer">
        <span>ISV ± € 150</span>
        <span>Pesquisa: BMW Série 3</span>
      </div>
    </div>
  );
}
