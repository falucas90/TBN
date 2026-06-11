import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import PageTop from '../../components/layout/PageTop';
import { Btn, Pill, Seg } from '../../components/ui/Primitives';
import { getFeedback, updateFeedbackStatus } from '../../services/feedbackService';
import { useToast } from '../../context/ToastContext';

const CATEGORY = {
  bug: { label: 'Problema', tone: 'coral' },
  sugestao: { label: 'Sugestão', tone: 'emerald' },
  outro: { label: 'Outro', tone: 'neutral' },
};

const STATUS = {
  novo: { label: 'Novo', tone: 'amber' },
  aprovado: { label: 'Aprovado', tone: 'emerald' },
  resolvido: { label: 'Resolvido', tone: 'neutral' },
  rejeitado: { label: 'Rejeitado', tone: 'coral' },
};

const FILTERS = { Tudo: null, Novos: 'novo', Aprovados: 'aprovado', Resolvidos: 'resolvido' };

// Self-contained prompt so a Claude Code session can act on the feedback
// without access to this conversation or the database.
function buildClaudePrompt(f) {
  const category = CATEGORY[f.category]?.label ?? f.category;
  return [
    'Feedback de utilizador do Crivo, aprovado pelo admin para implementação.',
    '',
    `Categoria: ${category} (${f.category})`,
    `Página onde foi reportado: ${f.page ?? '—'}`,
    `Utilizador: ${f.email ?? 'anónimo'}`,
    `Recebido em: ${new Date(f.created_at).toLocaleString('pt-PT')}`,
    `User agent: ${f.user_agent ?? '—'}`,
    '',
    'Mensagem do utilizador:',
    '"""',
    f.message,
    '"""',
    '',
    'Tarefa: investiga este feedback no código do Crivo e implementa a correção (se for um problema) ou avalia e implementa a sugestão. No final, resume o que mudou e como validar.',
    '',
    `(feedback id: ${f.id} — depois de validado, marcar como resolvido em /admin/feedback)`,
  ].join('\n');
}

export default function AdminFeedback() {
  const { addToast } = useToast();
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('Tudo');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    getFeedback()
      .then(setItems)
      .catch(() => {
        addToast('Erro ao carregar feedback.', 'danger');
        setItems([]);
      });
  }, [addToast]);

  const shown = useMemo(() => {
    const status = FILTERS[filter];
    return (items ?? []).filter((f) => !status || f.status === status);
  }, [items, filter]);

  const newCount = (items ?? []).filter((f) => f.status === 'novo').length;

  const setStatus = async (f, status, successMsg) => {
    setBusyId(f.id);
    try {
      await updateFeedbackStatus(f.id, status);
      setItems((prev) => prev.map((it) => (it.id === f.id ? { ...it, status } : it)));
      addToast(successMsg, 'success');
    } catch {
      addToast('Não foi possível atualizar o estado.', 'danger');
    } finally {
      setBusyId(null);
    }
  };

  const copyPrompt = async (f) => {
    try {
      await navigator.clipboard.writeText(buildClaudePrompt(f));
      addToast('Prompt copiado — cole numa sessão Claude Code para trabalhar a correção.', 'success');
    } catch {
      addToast('Não foi possível copiar para a área de transferência.', 'danger');
    }
  };

  return (
    <AppLayout>
      <div className="page">
        <PageTop
          title="Feedback"
          sub={items === null ? 'A carregar…' : `${newCount} por triar · aprovados ficam prontos para uma sessão Claude Code`}
          right={<Seg options={Object.keys(FILTERS)} value={filter} onChange={setFilter} />}
        />
        <div className="page__body" style={{ overflowY: 'auto', padding: '8px 32px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items === null ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div style={{ height: 14, background: 'var(--slate)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              ))
            ) : shown.length === 0 ? (
              <div className="card" style={{ padding: '48px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--dust)' }}>
                Sem feedback nesta vista.
              </div>
            ) : shown.map((f) => {
              const cat = CATEGORY[f.category] ?? { label: f.category, tone: 'neutral' };
              const st = STATUS[f.status] ?? { label: f.status, tone: 'neutral' };
              const busy = busyId === f.id;
              return (
                <div key={f.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Pill tone={cat.tone} mono>{cat.label}</Pill>
                    <Pill tone={st.tone}>{st.label}</Pill>
                    <span style={{ fontSize: 11.5, color: 'var(--dust)' }}>
                      {new Date(f.created_at).toLocaleString('pt-PT')} · {f.email ?? 'anónimo'} · {f.page ?? '—'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {f.message}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {f.status === 'novo' && (
                      <>
                        <Btn size="sm" variant="primary" disabled={busy} onClick={() => setStatus(f, 'aprovado', 'Feedback aprovado para implementação.')}>
                          Aprovar
                        </Btn>
                        <Btn size="sm" variant="danger" disabled={busy} onClick={() => setStatus(f, 'rejeitado', 'Feedback rejeitado.')}>
                          Rejeitar
                        </Btn>
                      </>
                    )}
                    {f.status === 'aprovado' && (
                      <>
                        <Btn size="sm" variant="primary" disabled={busy} onClick={() => copyPrompt(f)}>
                          Copiar prompt Claude
                        </Btn>
                        <Btn size="sm" disabled={busy} onClick={() => setStatus(f, 'resolvido', 'Feedback marcado como resolvido.')}>
                          Marcar resolvido
                        </Btn>
                      </>
                    )}
                    {(f.status === 'resolvido' || f.status === 'rejeitado') && (
                      <Btn size="sm" variant="ghost" disabled={busy} onClick={() => setStatus(f, 'novo', 'Feedback reaberto.')}>
                        Reabrir
                      </Btn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
