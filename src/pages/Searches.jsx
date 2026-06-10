import AppLayout from '../components/layout/AppLayout';
import { Card, Button, Badge, StatCard, ConfirmDialog } from '../components/ui';
import { getSearches, updateSearch, deleteSearch as deleteSearchById } from '../services/searchesService';
import { getAlertCountSince } from '../services/alertsService';
import { Search, TrendingUp, Bell, Plus, Play, Pause, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useState, useEffect } from 'react';

export default function Searches() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searches, setSearches] = useState(undefined);
  const [alertCount7d, setAlertCount7d] = useState(null);
  const [searchToDelete, setSearchToDelete] = useState(null);

  useEffect(() => {
    getSearches().then(setSearches).catch(() => {
      addToast('Erro ao carregar pesquisas.', 'danger');
      setSearches([]);
    });
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    getAlertCountSince(cutoff).then(setAlertCount7d).catch(() => setAlertCount7d(0));
  }, [addToast]);

  const toggleSearchStatus = async (id) => {
    const prev = searches.find(s => s.id === id);
    if (!prev) return;
    const isPausing = prev.status === 'active';
    const newStatus = isPausing ? 'paused' : 'active';
    setSearches(all => all.map(s => s.id === id ? { ...s, status: newStatus } : s));
    try {
      await updateSearch(id, { status: newStatus });
      addToast(isPausing ? 'Pesquisa pausada.' : 'Pesquisa retomada com sucesso.', isPausing ? 'warn' : 'success');
    } catch {
      setSearches(all => all.map(s => s.id === id ? { ...s, status: prev.status } : s));
      addToast('Erro ao atualizar pesquisa.', 'danger');
    }
  };

  const deleteSearch = async (id) => {
    setSearchToDelete(null);
    const snapshot = searches;
    setSearches(prev => prev.filter(s => s.id !== id));
    try {
      await deleteSearchById(id);
      addToast('Pesquisa eliminada.', 'warn');
    } catch {
      setSearches(snapshot);
      addToast('Erro ao eliminar pesquisa.', 'danger');
    }
  };

  if (searches === undefined) return (
    <AppLayout>
      <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: '100px', background: 'var(--graphite)', borderRadius: 'var(--r-lg)', marginBottom: '1rem', animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.6 }} />
        ))}
      </div>
    </AppLayout>
  );

  const activeSearches = searches.filter(s => s.status === 'active');
  const matchesToday = activeSearches.reduce((sum, s) => sum + s.matchesToday, 0);
  const highMarginCount = activeSearches.filter(s => s.avgMargin > 3000).length;
  const avgMarginValue = activeSearches.length > 0
    ? Math.round(activeSearches.reduce((sum, s) => sum + s.avgMargin, 0) / activeSearches.length)
    : 0;
  const platformCount = new Set(searches.flatMap(s => s.sources)).size;

  return (
    <AppLayout>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '500', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Pesquisas Ativas</h1>
            <p style={{ color: 'var(--dust)', fontSize: '13px' }}>Está a acompanhar {searches.length} pesquisas em {platformCount} plataformas.</p>
          </div>
          <Link to="/searches/new">
            <Button><Plus size={18} /> Nova pesquisa</Button>
          </Link>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <StatCard label="Matches Hoje" value={String(matchesToday)} trendLabel="em pesquisas ativas" icon={Search} />
          <StatCard label="Alta Margem" value={String(highMarginCount)} trendLabel="margem > €3.000" icon={TrendingUp} />
          <StatCard label="Alertas (7d)" value={alertCount7d === null ? '…' : String(alertCount7d)} trendLabel="últimos 7 dias" icon={Bell} />
          <StatCard label="Margem Média" value={`€${avgMarginValue.toLocaleString()}`} trendLabel="em pesquisas ativas" icon={TrendingUp} />
        </div>

        {/* Searches List */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>As suas Pesquisas</h2>

        {searches.length === 0 && (
          <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <Search size={32} style={{ color: 'var(--dust)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Ainda não tem pesquisas</h3>
            <p style={{ color: 'var(--ash)', fontSize: '13px', marginBottom: '1.5rem' }}>
              Crie a sua primeira pesquisa para começar a receber alertas de viaturas com margem.
            </p>
            <Link to="/searches/new">
              <Button><Plus size={18} /> Criar primeira pesquisa</Button>
            </Link>
          </Card>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {searches.map(search => {
            const isActive = search.status === 'active';
            
            return (
              <Card key={search.id} style={{ opacity: isActive ? 1 : 0.6, transition: 'opacity 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  
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
                      fontSize: '13px', color: 'var(--ash)',
                      display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', marginBottom: '1.5rem'
                    }}>
                      <span>Ano Mín: {search.criteria.minYear}</span>
                      <span>KMs Máx: {(search.criteria.maxMileage ?? search.criteria.maxKm ?? 0).toLocaleString()} km</span>
                      <span>Combustível: {search.criteria.fuel}</span>
                      <span>Plataformas: {search.sources.join(', ')}</span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      {isActive ? (
                        <>
                          <Button variant="secondary" onClick={() => navigate(`/alerts?search=${search.id}`)}><ExternalLink size={16} /> Ver Resultados</Button>
                          <Button variant="ghost" onClick={() => toggleSearchStatus(search.id)}><Pause size={16} /> Pausar</Button>
                        </>
                      ) : (
                        <Button variant="secondary" onClick={() => toggleSearchStatus(search.id)}><Play size={16} /> Retomar</Button>
                      )}
                      <Link to={`/searches/${search.id}/edit`}>
                        <Button variant="ghost">Editar</Button>
                      </Link>
                      <Button variant="ghost" onClick={() => setSearchToDelete(search)}>Eliminar</Button>
                    </div>
                  </div>

                  {/* Right abstract stats */}
                  <div style={{ 
                    textAlign: 'right', display: 'flex', flexDirection: 'column', 
                    alignItems: 'flex-end', gap: '0.25rem' 
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--dust)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Margem Média Est.</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '500', color: 'var(--emerald)' }}>
                      €{search.avgMargin.toLocaleString()}
                    </span>
                  </div>

                </div>
              </Card>
            );
          })}
        </div>

        <ConfirmDialog
          open={Boolean(searchToDelete)}
          title="Eliminar pesquisa"
          description={`Eliminar a pesquisa "${searchToDelete?.title}"? Esta ação é irreversível.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={() => deleteSearch(searchToDelete.id)}
          onCancel={() => setSearchToDelete(null)}
        />
      </div>
    </AppLayout>
  );
}
