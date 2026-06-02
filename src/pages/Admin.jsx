import React from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Card } from '../components/ui';
import { mockUsers } from '../data/mock-data';

export default function Admin() {
  return (
    <AppLayout>
      <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>Painel de Administração</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Contas de revendedores registadas na plataforma
        </p>

        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Nome</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Plano</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: '500' }}>{user.name}</td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-secondary)' }}>{user.email}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>{user.plan}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: user.status === 'active' ? 'var(--color-success-bg)' : 'var(--color-border)',
                        color: user.status === 'active' ? 'var(--color-success-text)' : 'var(--color-text-secondary)'
                      }}>
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
