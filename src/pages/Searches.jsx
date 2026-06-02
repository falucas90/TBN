import React from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button, Badge, StatCard } from '../components/ui';
import { mockSearches as initialMockSearches } from '../data/mock-data';
import { Search, TrendingUp, Bell, Plus, Play, Pause, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useState } from 'react';

export default function Searches() {
  const { addToast } = useToast();
  const [searches, setSearches] = useState(initialMockSearches);

  const toggleSearchStatus = (id) => {
    setSearches(prev => prev.map(s => {
      if (s.id === id) {
        const isPausing = s.status === 'active';
        addToast(isPausing ? 'Pesquisa pausada.' : 'Pesquisa retomada com sucesso.', isPausing ? 'warn' : 'success');
        return { ...s, status: isPausing ? 'paused' : 'active' };
      }
      return s;
    }));
  };

  const deleteSearch = (id) => {
    setSearches(prev => prev.filter(s => s.id !== id));
    addToast('Pesquisa eliminada.', 'warn');
  };

  return (
    <AppLayout>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.25rem' }}>Pesquisas Ativas</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Está a acompanhar {searches.length} pesquisas em 2 plataformas.</p>
          </div>
          <Link to="/searches/new">
            <Button><Plus size={18} /> Nova pesquisa</Button>
          </Link>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
          <StatCard label="Matches Hoje" value="3" trend="+1" trendLabel="vs ontem" icon={Search} />
          <StatCard label="Alta Margem" value="1" trend="↑" trendLabel="top tier" icon={TrendingUp} />
          <StatCard label="Alertas (7d)" value="12" trend="-2%" trendLabel="vs semana passada" icon={Bell} />
          <StatCard label="Margem Média" value="€2,650" trend="+€120" trendLabel="vs mês passado" icon={TrendingUp} />
        </div>

        {/* Searches List */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>As suas Pesquisas</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {searches.map(search => {
            const isActive = search.status === 'active';
            
            return (
              <Card key={search.id} style={{ opacity: isActive ? 1 : 0.6, transition: 'opacity 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  
                  {/* Left info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>{search.title}</h3>
                      <Badge variant={isActive ? 'success' : 'warn'}>
                        {isActive ? 'Ativo' : 'Pausado'}
                      </Badge>
                      {search.matchesToday > 0 && isActive && (
                        <Badge variant="primary">{search.matchesToday} novos hoje</Badge>
                      )}
                    </div>
                    
                    <div style={{ 
                      fontSize: '0.875rem', color: 'var(--color-text-secondary)', 
                      display: 'flex', gap: '1rem', marginBottom: '1.5rem' 
                    }}>
                      <span>Ano Mín: {search.criteria.minYear}</span>
                      <span>KMs Máx: {search.criteria.maxMileage.toLocaleString()} km</span>
                      <span>Combustível: {search.criteria.fuel}</span>
                      <span>Plataformas: {search.sources.join(', ')}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {isActive ? (
                        <>
                          <Button variant="secondary" onClick={() => addToast('A abrir resultados...', 'info')}><ExternalLink size={16} /> Ver Resultados</Button>
                          <Button variant="ghost" onClick={() => toggleSearchStatus(search.id)}><Pause size={16} /> Pausar</Button>
                        </>
                      ) : (
                        <Button variant="secondary" onClick={() => toggleSearchStatus(search.id)}><Play size={16} /> Retomar</Button>
                      )}
                      <Link to={`/searches/${search.id}/edit`}>
                        <Button variant="ghost">Editar</Button>
                      </Link>
                      <Button variant="ghost" onClick={() => deleteSearch(search.id)}>Eliminar</Button>
                    </div>
                  </div>

                  {/* Right abstract stats */}
                  <div style={{ 
                    textAlign: 'right', display: 'flex', flexDirection: 'column', 
                    alignItems: 'flex-end', gap: '0.25rem' 
                  }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Margem Média Est.</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-success-text)' }}>
                      €{search.avgMargin.toLocaleString()}
                    </span>
                  </div>

                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
