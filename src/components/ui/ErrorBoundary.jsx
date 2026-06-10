import { Component } from 'react';
import * as Sentry from '@sentry/react';
import { BrandLockup } from './Logo';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--obsidian)', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '2rem',
      }}>
        <BrandLockup markSize={28} wordSize={16} />
        <div>
          <p style={{ fontSize: '4rem', fontWeight: 700, color: 'var(--hairline)', lineHeight: 1, marginBottom: '0.5rem' }}>:(</p>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Algo correu mal</h1>
          <p style={{ color: 'var(--ash)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            Ocorreu um erro inesperado. Recarregue a página para continuar.
          </p>
          <button
            className="btn btn--primary"
            onClick={() => window.location.reload()}
          >
            Recarregar página
          </button>
        </div>
        {import.meta.env.DEV && this.state.error && (
          <pre style={{ fontSize: '11px', color: 'var(--dust)', maxWidth: 600, textAlign: 'left', background: 'var(--graphite)', padding: '1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--hairline)', overflow: 'auto' }}>
            {this.state.error.toString()}
          </pre>
        )}
      </div>
    );
  }
}
