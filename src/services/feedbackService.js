import { supabase, supabaseConfigured } from '../lib/supabase';

// Mock store so the feedback loop works end-to-end without Supabase.
const mockFeedback = [
  {
    id: 'mock-fb-1',
    email: 'beta@exemplo.pt',
    category: 'bug',
    message: 'O filtro de preço na pesquisa não guarda o valor máximo quando edito.',
    page: '/searches',
    user_agent: 'Mozilla/5.0',
    status: 'novo',
    admin_notes: null,
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-fb-2',
    email: 'stand@exemplo.pt',
    category: 'sugestao',
    message: 'Seria útil exportar o histórico de alertas para CSV.',
    page: '/alerts',
    user_agent: 'Mozilla/5.0',
    status: 'aprovado',
    admin_notes: null,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function submitFeedback({ category, message }) {
  if (!supabaseConfigured) {
    mockFeedback.unshift({
      id: `mock-fb-${Date.now()}`,
      email: 'demo@crivo.pt',
      category,
      message,
      page: window.location.pathname,
      user_agent: navigator.userAgent,
      status: 'novo',
      admin_notes: null,
      created_at: new Date().toISOString(),
    });
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('feedback').insert({
    user_id: user?.id ?? null,
    email: user?.email ?? null,
    category,
    message,
    page: window.location.pathname,
    user_agent: navigator.userAgent,
  });

  if (error) throw error;
}

// Admin: list feedback, newest first. RLS only allows admins to select.
export async function getFeedback() {
  if (!supabaseConfigured) return [...mockFeedback];

  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

// Admin: triage transition (novo → aprovado/rejeitado → resolvido).
export async function updateFeedbackStatus(id, status) {
  if (!supabaseConfigured) {
    const item = mockFeedback.find((f) => f.id === id);
    if (item) item.status = status;
    return;
  }

  const { error } = await supabase
    .from('feedback')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}
