import { Link } from 'react-router-dom';
import { SieveMark, Wordmark } from '../components/ui/Logo';
import { Icon, Dot } from '../components/ui/Primitives';
import WhatsAppCard from '../components/ui/WhatsAppCard';
import '../styles/landing.css';

function SiteNav() {
  return (
    <nav className="site-nav">
      <div className="site__inner site-nav__row">
        <Link className="site-nav__brand" to="/">
          <SieveMark size={24} color="var(--bone)" strokeWidth={2} />
          <Wordmark size={17} />
        </Link>
        <div className="site-nav__actions">
          <Link className="btn btn--ghost" to="/login">Entrar</Link>
          <Link className="btn btn--primary" to="/signup">Criar conta</Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header className="hero grain">
      <div className="site__inner hero__row">
        <div>
          <div className="hero__eyebrow">
            <Dot tone="emerald" />
            <span className="eyebrow">Sourcing europeu para stands portugueses</span>
          </div>
          <h1 className="hero__title">Filtra o ruído.<br />Encontra a <em>margem</em>.</h1>
          <p className="hero__sub">
            O Crivo vigia as principais plataformas europeias de usados, a cada minuto.
            Quando um carro passa nos teus filtros, recebes um alerta no WhatsApp —
            já com ISV, custo landed em Portugal e margem estimada.
          </p>
          <div className="hero__cta">
            <Link className="btn btn--primary btn--lg" to="/signup">
              Criar conta
              <Icon name="arrow" size={14} />
            </Link>
          </div>
          <p className="hero__note">Sem cartão de crédito · Primeira pesquisa em 2 minutos</p>
        </div>
        <div className="hero__visual">
          <span className="hero__visual-label">Alerta · WhatsApp · em tempo real</span>
          <WhatsAppCard />
        </div>
      </div>
    </header>
  );
}

function Platforms() {
  return (
    <section className="platforms">
      <div className="site__inner platforms__row">
        <span className="platforms__label">Plataformas vigiadas</span>
        <div className="platforms__list">
          <span>Mobile.de</span>
          <span>AutoScout24</span>
          <span>Hey.car</span>
          <span>Kleinanzeigen</span>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: 'filter',
      title: 'Pesquisas calibradas',
      body: 'Marca, motor, quilómetros, ano, preço, país. Defines o crivo uma vez — só passa o que interessa.',
    },
    {
      icon: 'bell',
      title: 'Alertas onde já estás',
      body: 'Sem mais um dashboard aberto. O anúncio certo chega ao teu WhatsApp minutos depois de ser publicado.',
    },
    {
      icon: 'calc',
      title: 'Margem antes do clique',
      body: 'ISV, transporte e legalização calculados automaticamente. Cada alerta diz quanto vale o negócio.',
    },
  ];
  return (
    <section className="features">
      <div className="site__inner features__grid">
        {items.map((f) => (
          <div key={f.title} className="feature">
            <div className="feature__icon">
              <Icon name={f.icon} size={16} />
            </div>
            <h3 className="feature__title">{f.title}</h3>
            <p className="feature__body">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site__inner site-footer__row">
        <div className="site-footer__brand">
          <SieveMark size={18} color="var(--dust)" strokeWidth={2.5} />
          <span className="site-footer__meta">Crivo · v1.0 · Lisboa</span>
        </div>
        <div className="site-footer__links">
          <Link to="/termos">Termos e Condições</Link>
          <Link to="/privacidade">Privacidade</Link>
          <a href="mailto:suporte@crivo.pt">Contacto</a>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="site">
      <SiteNav />
      <Hero />
      <Platforms />
      <Features />
      <SiteFooter />
    </div>
  );
}
