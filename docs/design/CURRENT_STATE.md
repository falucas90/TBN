# Crivo — Current State: UI/UX & Design System Audit

**Type:** whole-product audit, not a feature spec. **Scope:** every route in `src/App.jsx`, every component in `src/components/{ui,forms,layout}/`, and the tokens in `src/styles/tokens.css`, as they exist in the repository today. **Method:** read every file listed below directly; every claim in this document is traceable to a specific file. Nothing here was run in a browser — states are inferred from the code paths that produce them, not from a live click-through.

**Files read:** `src/styles/*.css`, `src/components/ui/*.jsx`, `src/components/forms/*.jsx`, `src/components/layout/*.jsx`, all of `src/pages/**/*.jsx`, `src/App.jsx`, `src/context/*.jsx`, `src/lib/useMediaQuery.js`, `src/services/*.js`, `src/data/mock-data.js`, `README.md`.

This document is **descriptive**, except section 5, which is where anything needing a founder/CPO call is flagged rather than decided.

---

## 1. Design system snapshot

### Tokens (`src/styles/tokens.css`)

One `:root` block, one theme (light "paper," no dark mode variant anywhere in the codebase):

| Category | Tokens |
|---|---|
| Surfaces | `--obsidian` (page bg), `--graphite` (card/surface bg), `--slate`, `--slate-2`, `--hairline`, `--hairline-strong` |
| Ink (text) | `--bone` (primary text), `--ash` (secondary), `--dust` (tertiary/muted), `--chalk` (placeholder-level) |
| Signal | `--emerald` / `--emerald-ink` / `--mint`, `--amber`, `--coral`, plus 10–20% tint variants (`--emerald-12`, `--emerald-20`, `--amber-12`, `--coral-12`) |
| Type | `--font-display` (General Sans, loaded from Fontshare CDN), `--font-mono` (JetBrains Mono); size scale `--fs-eyebrow` (11px) → `--fs-3xl` (40px); two line-heights, three letter-spacing values |
| Spacing | `--s-1` (4px) → `--s-11` (80px), consistent 4px-driven scale |
| Radius | `--r-sm` (6px) → `--r-full`; `--r-input` is an alias for `--r-md` |
| Motion | `--t-fast/base/slow` (120/180/240ms) + one shared `--ease` cubic-bezier |
| Layout | `--sidebar-w` (220px), `--sidebar-collapsed` (64px) |
| Shadow | exactly one: `--shadow-lg` |

A **legacy alias block** (~15 variables, e.g. `--color-primary-teal`, `--color-bg-page`, `--radius-input`) is kept "so nothing breaks," mapping old naming onto the new tokens — evidence of a prior token rename that some components never migrated off of (see section 4).

Five more stylesheets layer on top: `global.css` (reset + the actual component classes: `.btn`, `.input`, `.card`, `.pill`, `.seg`, `.switch`, `.t` table, sidebar/app shell, page chrome, search cards, alert timeline, dashboard stats, settings, mobile nav, responsive rules), `components.css` (a small generic utility set), `app.css` (screen-specific classes explicitly "ported from Crivo App.html design," e.g. `.login`, `.isv`, `.dash-*`, `.wa-card`), `admin.css` (admin-only classes layered on the same tokens, "ported from the design bundle's admin-embed.css"), `landing.css` (marketing site only).

### Component inventory

**`src/components/ui/`** — 16 files. 12 are re-exported from `index.js`; `Logo.jsx`, `Primitives.jsx`, `WhatsAppCard.jsx` and `ErrorBoundary.jsx` are imported directly by path instead.

| Component | Used by (outside its own file/tests) | Status |
|---|---|---|
| `Primitives.jsx` (`Icon`, `Pill`, `Dot`, `Btn`, `Seg`, `Switch`, `NumPair`, + its own `SieveMark`/`Wordmark`) | Landing, Dashboard, Searches, CreateSearch, AlertHistory, IsvCalculator, Settings, Sidebar, all 5 Admin pages | **The de facto core kit** — broadest reuse in the app |
| `Logo.jsx` (`SieveMark`, `Wordmark`, `BrandLockup`) | Landing, Login, Signup, Sidebar, ForgotPassword, ResetPassword, VerifyEmail, NotFound, ErrorBoundary, LegalLayout | Broadly reused |
| `AppLayout` / `PageTop` (layout/) | All 11 authenticated pages (6 dealer + 5 admin) | Broadly reused |
| `FeedbackWidget` | Mounted once, globally, inside `AppLayout` | Broadly reused (every authenticated screen) |
| `Button` | `ForgotPassword`, `ResetPassword`, `VerifyEmail`, `NotFound`, plus internally by `ConfirmDialog` and `FeedbackWidget` | Reused, but only in modals + the 4 "auth-utility" pages — every core/admin page uses `Btn` (Primitives) instead |
| `ConfirmDialog` | `CreateSearch` (1 instance), `Settings` (2 instances) | Narrow but real reuse; has a dedicated test file |
| `WhatsAppCard` | `Landing`, `CreateSearch` | Narrow reuse (shared marketing/product visual) |
| `OnboardingPanel` | `Searches` only | Single-purpose; has a dedicated test file |
| `Callout` | `ForgotPassword`, `ResetPassword` (3 instances total) | Single-purpose |
| `ErrorBoundary` | Mounted once, root of `App.jsx` | Single-purpose by design |
| `Badge` | **None** | Unused — `Pill` (Primitives) covers the same job |
| `Card` | **None** | Unused — pages use the raw `.card` className directly |
| `SegmentedControl` | **None** | Unused — `Seg` (Primitives) covers the same job |
| `Slider` | **None** | Unused — no range-slider UI exists anywhere in the app |
| `StatCard` | **None** | Unused — Dashboard and AdminOverview each hand-roll their own stat-card markup instead |
| `StepIndicator` | **None** | Unused — CreateSearch/IsvCalculator use plain "01 / 04" text instead |
| `Toggle` | **None** | Unused — `Switch` (Primitives) covers the same job |

**`src/components/forms/`** — 3 files, exported from `index.js`:

| Component | Used by | Status |
|---|---|---|
| `FormField` | `ForgotPassword`, `ResetPassword` | Narrow reuse |
| `CurrencyInput` | **None** | Unused — every money field in the app (CreateSearch, IsvCalculator, Settings) is a plain `<input type="number" className="input tnum">` with no € prefix while typing |
| `PlatformCheckbox` | **None** | Unused — CreateSearch's country picker uses clickable `Pill` spans instead, and there is no UI anywhere for picking marketplaces directly |

**`src/components/layout/`** — 4 files, all used everywhere authenticated: `AppLayout`, `PageTop`, `Sidebar` (desktop, ≥768px), `MobileNav` (mobile, <768px), switched by one shared `useMediaQuery('(max-width: 768px)')` check.

**Headline number:** of the **15 components exported from the `ui/`+`forms/` barrel files**, **8 (53%) are not imported anywhere in the app** — `Badge`, `Card`, `SegmentedControl`, `Slider`, `StatCard`, `StepIndicator`, `Toggle` (ui/), and `CurrencyInput`, `PlatformCheckbox` (forms/). Every screen that actually ships is built on a second, parallel kit (`Primitives.jsx`) plus a handful of the barrel components. See section 4 for what this costs in practice (duplicated implementations, some referencing tokens that don't exist).

---

## 2. Navigation & IA

Route map, from `src/App.jsx` (21 `<Route>` entries, 20 distinct page components — `CreateSearch` serves two routes):

| Path | Component | Guard |
|---|---|---|
| `/` | Landing | public |
| `/login` | Login | public |
| `/signup` | Signup | public (see note below) |
| `/forgot-password` | ForgotPassword | public |
| `/reset-password` | ResetPassword | public |
| `/verify-email` | VerifyEmail | public |
| `/termos` | Terms (via `LegalLayout`) | public |
| `/privacidade` | Privacy (via `LegalLayout`) | public |
| `/dashboard` | Dashboard | `ProtectedRoute` (auth only) |
| `/searches` | Searches | `ProtectedRoute` |
| `/searches/new` | CreateSearch | `ProtectedRoute` |
| `/searches/:id/edit` | CreateSearch | `ProtectedRoute` |
| `/alerts` | AlertHistory | `ProtectedRoute` |
| `/isv` | IsvCalculator | `ProtectedRoute` |
| `/settings` | Settings | `ProtectedRoute` |
| `/admin` | AdminOverview | `AdminRoute` (role === 'admin') |
| `/admin/stands` | AdminStands | `AdminRoute` |
| `/admin/billing` | AdminBilling | `AdminRoute` |
| `/admin/logs` | AdminLogs | `AdminRoute` |
| `/admin/feedback` | AdminFeedback | `AdminRoute` |
| `*` | NotFound | public |

`ProtectedRoute` only checks `isAuthenticated` — it does **not** check role. `AdminRoute` checks `currentUser?.role === 'admin'` and redirects non-admins to `/dashboard`. There is no equivalent redirect the other way: nothing stops an authenticated platform admin from opening `/dashboard`, `/searches`, `/isv`, etc. (see section 5 — this matters because the README states admins "have no company and no access to dealer business data").

`/signup` renders a static "beta privada por convite" notice (not a real signup form) and is not linked from anywhere in the app — Landing's nav/hero and the Signup page itself all point to `/login` or a `mailto:` link, never to `/signup`. It is only reachable by typing the URL directly.

### How Sidebar / MobileNav expose it

**Sidebar** (desktop, ≥768px, `src/components/layout/Sidebar.jsx`):
- Fixed 220px column. Brand mark (SieveMark + "CRIVO") at top — it is a static div, not a `<Link>`; clicking it does nothing (contrast with Landing's nav brand mark, which links to `/`).
- Items, always rendered regardless of role: Dashboard, Pesquisas (badge = live count of the company's searches), Histórico de alertas (badge = count of up to 500 fetched alerts, not an "unread" count), Calculadora ISV, Definições.
- If `currentUser.role === 'admin'`: an "Admin" section label plus 5 admin links is appended **below** the same list — dealer and admin navigation coexist in one menu for admin accounts.
- Footer: avatar (initials from name), display name, company name (falls back to "Crivo" when there is none — the case for platform admins), a logout icon-button.
- A `--sidebar-collapsed` token and a `.side--collapsed` CSS class exist in the stylesheet, but nothing in `Sidebar.jsx` (or anywhere else) ever sets that class — there is no collapse toggle wired up.

**MobileNav** (mobile, <768px, `src/components/layout/MobileNav.jsx`):
- Fixed bottom tab bar. Same 5 dealer items, plus a single "Admin" tab (links only to `/admin` — the other 4 admin sub-pages have no mobile nav entry point at all), plus a "Sair" (logout) tab.
- The "Alertas" tab shows a live unread badge sourced from `AlertsContext`'s Supabase realtime subscription — a different signal than Sidebar's plain total count for the same nav item (see section 4).
- No brand mark on mobile nav.

---

## 3. Screen-by-screen inventory

Grouped the same way as section 2. For each screen: purpose, key components, and which of loading/empty/error/success are actually implemented.

### Public / marketing

**Landing (`/`)** — `src/pages/Landing.jsx`
- Purpose: single marketing page; the only call to action is "Pedir convite," a `mailto:suporte@crivo.pt` link (used identically in the nav, the hero, and reused verbatim on the Signup page).
- Components: `Logo` (SieveMark/Wordmark), `Primitives` (`Icon`, `Dot`), `WhatsAppCard`.
- States: none apply — fully static, no forms, no data fetching.

### Auth gateway

**Login (`/login`)** — `src/pages/Login.jsx`
- Purpose: email/password sign-in for invited users.
- Components: none from `ui/`/`forms/` — raw `.login`/`.field`/`.input`/`.btn` classes, plus `SieveMark`/`Wordmark` from `Logo.jsx`.
- States: **Loading** = submit button label swaps to "A entrar…" + disabled (no page-level spinner). **Error** = inline raw `<p style={{color:'var(--coral)'}}>`, covering both client-side validation ("Introduza um endereço de email válido.", "A palavra-passe deve ter pelo menos 8 caracteres.") and 4 mapped server errors (invalid credentials, unconfirmed email, rate-limited, generic). **Success** = `navigate('/dashboard')`. No "create account" link (consistent with signup being invite-only/orphaned); has a "Esqueceu-se da palavra-passe?" link.

**Signup (`/signup`)** — `src/pages/Signup.jsx`
- Purpose: not a form — a static "beta privada por convite" notice with the same `mailto:` CTA and a link back to `/login`.
- Components: `Logo` only. States: none (static). Orphaned route (see section 2).

**ForgotPassword (`/forgot-password`)** — `src/pages/ForgotPassword.jsx`
- Components: `Button`, `Callout`, `FormField`, `BrandLockup`.
- States: **Loading** = button label "A enviar...". **Success** = form is replaced by `Callout(variant="success")`, "Email enviado" / "Verifique a sua caixa de entrada." **Error** = deliberately not surfaced — the catch block is a no-op by design (comment: "Always show success regardless — don't reveal if email exists"), so the success state always shows.

**ResetPassword (`/reset-password`)** — `src/pages/ResetPassword.jsx`
- The most state-complete auth screen: an explicit `status` state machine with 4 values.
- **checking** = plain text "A verificar...". **invalid** = `Callout(variant="danger")` "Link expirado ou inválido" + "Pedir novo link" button + back-to-login link. **valid** = the real form (new password, confirm password, live mismatch check rendered as a hand-written `<p>`, generic catch-block error also a hand-written `<p>`, submit button "A redefinir..."). **success** = `Callout(variant="success")` + inline link to `/login`.
- Components: `Button`, `Callout`, `FormField`, `BrandLockup`.

**VerifyEmail (`/verify-email`)** — `src/pages/VerifyEmail.jsx`
- Purpose: "check your email" holding screen; auto-redirects to `/searches` once `currentUser.email_confirmed_at` is set.
- States: **Loading** = resend button "A reenviar..." + disabled during a 60s cooldown (shown as "Reenviar disponível em Ns"). **Success** = always shows a green confirmation line regardless of the actual resend outcome (same don't-reveal-failure pattern as ForgotPassword). No error state.
- Components: `Button`, `BrandLockup`, lucide `Mail` icon.

**NotFound (`*`)** — `src/pages/NotFound.jsx`
- Static 404. Single CTA "← Voltar ao início" → `/searches` (not `/` or `/dashboard`). Only screen in the app using the legacy alias `var(--page)` instead of `var(--obsidian)` directly. Uses `Button` with its default (grey) variant, not primary.

### Legal

**Terms (`/termos`) / Privacy (`/privacidade`)** — `src/pages/legal/Terms.jsx`, `Privacy.jsx`, both via `LegalLayout.jsx`
- Static PT-PT legal copy. `LegalLayout` supplies a `BrandLockup` header and a "← Voltar" link that always points to `/login`, regardless of entry point (Landing's footer is the only in-app link to these pages for a logged-out visitor, and it lands them on a "back to login" rather than "back to site" link).
- States: none (static).

### Core app (dealer-facing)

**Dashboard (`/dashboard`)** — `src/pages/Dashboard.jsx`
- Purpose: business KPI overview — 4 hero stats, a "market pulse" table, a conversion funnel, a cost-vs-margin chart, a 3-column pipeline board.
- Components: `PageTop`, `Primitives` (`Btn`, `Seg`), a hand-rolled inline SVG sparkline (`<Spark>`) and a hand-rolled inline SVG line chart — neither is a shared component.
- States: **none** — every number, table row, chart series and pipeline card is a hardcoded constant in the file (`HERO`, `TRENDS`, `FUNNEL`, `PIPELINE`, `MONTHS`, `ISV_LINE`, `MARGIN_LINE`). No service is called, so there is no loading/empty/error state because there is nothing that can fail or be empty. Only the greeting ("Boa tarde, {firstName}…") is real, from `useAuth()`. The date-range (`7 dias/30 dias/90 dias`) and region (`Todos/DE/AT/NL`) `Seg` controls hold local state but don't re-slice any displayed data.

**Searches (`/searches`)** — `src/pages/Searches.jsx`
- Purpose: list of the company's saved searches; entry point to create/edit; first-run onboarding.
- Components: `PageTop` (filter input in the header), `OnboardingPanel` (first run only, dismissal persisted via `localStorage`), search-card grid.
- States: **Loading** = 3 pulsing skeleton cards + PageTop subtitle "A carregar…". **Empty** = "Ainda não tem pesquisas. Crie a primeira." (no data) vs. "Sem pesquisas para "{query}"." (filtered to zero) — two distinct copies for two distinct causes. **Error** = toast "Erro ao carregar pesquisas." + falls back to an empty array (visually identical to a genuine empty account after the toast fades). **Success** = card grid with status dot (Ativa/Em pausa), summary line, 3 stat pairs. The onboarding "Criar pesquisa de exemplo" button performs a real `createSearch()` call, not a decorative one.

**CreateSearch (`/searches/new`, `/searches/:id/edit`)** — `src/pages/CreateSearch.jsx`
- Purpose: one form (4 sections: Veículo, Preço & margem, Países de origem, Notificações) for both create and edit, with a sticky live "audience estimate" + `WhatsAppCard` alert preview.
- Components: `PageTop`, `ConfirmDialog` (delete), `WhatsAppCard`, `Primitives` (`Btn`/`Icon`/`Pill`/`Seg`/`Switch`).
- States: **Loading** (edit mode only) = `if (loading) return null` — a blank page, no spinner or skeleton, until fields populate. **Not found** = toast "Pesquisa não encontrada." + redirect to `/searches`. **Validation errors** = 3 specific warn-toasts (min year > max year, min km > max km, no country selected), and they only block the "activate" path, not "save as draft." **Save/delete loading** = button label swap ("A guardar…") + all header action buttons disabled together. **Error** = danger toast on save/delete failure. **Success** = toast (copy varies by create/edit × active/paused) + redirect. Delete goes through `ConfirmDialog` (danger, no typed confirmation).
- The "audience estimate" numbers are a deterministic local formula (`estimateAudience`), not a backend query, shown with the same visual weight as real data.

**AlertHistory (`/alerts`)** — `src/pages/AlertHistory.jsx`
- Purpose: day-grouped feed of matched alerts; ISV/landed-cost/margin computed client-side per row via `calculateISV`.
- Components: `PageTop`, `Primitives` (`Btn`/`Icon`/`Pill`/`Seg`).
- States: **Loading** = 3 pulsing skeleton rows + PageTop subtitle "A carregar…". **Empty** = "Nenhum alerta corresponde aos filtros selecionados." (identical whether there are zero alerts ever, or the filters just matched nothing). **Error** = toast "Erro ao carregar alertas." + empty fallback. **Success** = day-grouped rows with platform/time/PHEV/risk pills and a 3-column price stack (Anúncio / Landed PT / Margem, margin shown as "—" rather than a computed NaN when `marketPrice` is unknown).
- The "Todos / Abertos / Descartados" `Seg` sets a `view` state that the filtering logic never reads — selecting anything but the default currently has no visible effect (see section 5).

**IsvCalculator (`/isv`)** — `src/pages/IsvCalculator.jsx`
- Purpose: standalone landed-cost/ISV calculator; editable specs on the left, sticky live result panel on the right.
- Components: `PageTop`, `Primitives` (`Btn`/`Dot`/`Icon`/`Seg`); `calculateISV` runs synchronously client-side.
- States: no loading/error/empty states are possible or implemented — everything is local state recomputed via `useMemo`. "Guardar estimativa," "Importar histórico," and the URL-paste field are all inert: they show a toast ("Estimativa guardada." / "Importação de histórico em breve.") but call no service — the pasted URL is never read. The only dynamic indicator is a confidence `Dot` (emerald "± € 150 · dados completos" vs. amber "± € 500 · faltam dados") based on whether cc/CO₂ are non-zero.
- Layout note: the two-column `.isv` grid has no responsive breakpoint anywhere in the stylesheets (see section 4) — unlike CreateSearch's structurally identical form + sticky-panel layout, which does collapse to one column under 900px.

**Settings (`/settings`)** — `src/pages/Settings.jsx`
- Purpose: account, company, team, WhatsApp/notification, calculation-defaults, subscription, and danger-zone settings — one long scrolling page, 7 sections.
- Components: `PageTop`, `ConfirmDialog` ×2 (delete account, remove member), `Primitives` (`Btn`/`Pill`/`Dot`/`Switch`).
- States: edit-in-place pattern reused for name/phone/company (click "Editar"/"Alterar"/"Adicionar" → inline input(s) + "Guardar"). **Write errors**: consistent danger toasts across every mutation (profile, company, defaults, invite, role change, remove member, export, delete). **Read errors**: the 3 initial fetches (`getProfile`, `getCompany`, `listMembers`) are the exception to the rest of the app — `getProfile`/`getCompany` fail silently (`.catch(() => {})`, no toast, fields just stay at their defaults), and `listMembers` falls back to `[]` with no toast either — none of Settings' own data loads shows a visible error, unlike every list screen elsewhere. **Empty** (team section, owner-only) = "Ainda sem membros na equipa." **Subscription section** is fully static/mocked (plan/price/"Ativa" pill hardcoded; "Gerir pagamento" only opens an info toast "Portal de pagamento em breve."). Both `ConfirmDialog`s (delete account, remove member) use plain click-to-confirm, not the component's typed-confirmation mode.

### Admin (platform)

**AdminOverview (`/admin`)** — `src/pages/admin/AdminOverview.jsx`
- Purpose: platform-wide KPIs for platform admins.
- Components: `PageTop`, `Primitives` (`Dot`/`Pill`/`Seg`), an inline `.bars` bar chart (hand-rolled).
- States: the 4 top stat tiles are real (`getAdminStats()`) and show "…" while loading; on fetch failure the catch also sets `stats` back to `null`, so **loading and error render identically** ("…" persists forever either way, no toast, no retry). Everything below — the 7/30/90-day bar-chart values and the 4-row "Fontes" (marketplace source health) list — is hardcoded mock data with no fetch, no loading, no error, rendered in the same card chrome as the real tiles with no visual distinction between live and illustrative numbers.

**AdminStands (`/admin/stands`)** — `src/pages/admin/AdminStands.jsx`
- Purpose: manage dealer accounts platform-wide — search, invite, role change, block/unblock, paginate.
- Components: `PageTop`, `Primitives` (`Btn`/`Icon`/`Pill`/`Seg`), `.t` table.
- States: **Loading** = 3 skeleton rows. **Error** = toast "Erro ao carregar utilizadores." + empty fallback. **Empty** = "Sem contas para mostrar." / "Sem resultados para "{query}"." **Success** = full table with per-row dirty-state detection (role `<select>` only reveals "Guardar" once changed) and per-row saving indicator. Real pagination (Anterior/Seguinte, "Página X de Y"). Self-protection guards produce distinct copy: self-demotion warns rather than blocking ("Vai perder acesso de administrador no próximo início de sessão."), self-deactivation is blocked outright ("Não pode desativar a sua própria conta.").
- The most state-complete screen in the app (loading, two empty variants, error, success, plus row-level pending state).

**AdminBilling (`/admin/billing`)** — `src/pages/admin/AdminBilling.jsx`
- Purpose: subscription/invoice overview.
- States: **none** — explicitly commented in the source: "Billing has no backend yet — this mirrors the design mock until Stripe lands." MRR, invoices and plan distribution are hardcoded constants; "Exportar CSV" only opens an info toast ("Exportação CSV em breve.").

**AdminLogs (`/admin/logs`)** — `src/pages/admin/AdminLogs.jsx`
- Purpose: audit trail of admin role/status changes.
- States: **Loading** = skeleton rows in a single card. **Error** = toast "Erro ao carregar registos." + empty fallback (a secondary `listUsers()` call, used only to resolve actor/target emails, fails silently with no toast — non-critical by design). **Empty** = "Sem registos de auditoria." **Success** = flat rows (time · kind pill · message · actor) with a Tudo/Função/Estado filter.

**AdminFeedback (`/admin/feedback`)** — `src/pages/admin/AdminFeedback.jsx`
- Purpose: triage inbox for in-app feedback, with a `novo → aprovado/rejeitado → resolvido` workflow and a "copy an LLM-ready prompt" action for approved items (feeds directly into the CTO's own feedback→Claude Code loop described in `CLAUDE.md`).
- States: **Loading** = 3 skeleton cards. **Error** = toast "Erro ao carregar feedback." + empty fallback. **Empty** = "Sem feedback nesta vista." **Success** = one card per item, category/status pills, metadata line, status-dependent actions, each guarded by a per-item `busyId` so only the clicked card disables during its own request.

### Global / cross-cutting (not routes, but real screens/states)

- **Auth loading spinner** (`AuthLoadingSpinner`, defined inline in `App.jsx`): full-viewport spinner shown by both `ProtectedRoute` and `AdminRoute` while auth resolves. The only loading treatment in the app built from raw hex colors (`#ffffff`, `#e0e0e0`) and an inline `<style>` keyframe block, rather than tokens/`global.css`.
- **ErrorBoundary fallback** (`components/ui/ErrorBoundary.jsx`): catches render errors anywhere in the tree; shows `BrandLockup` + ":(" + "Algo correu mal" + "Recarregar página"; reports to Sentry only if `VITE_SENTRY_DSN` is set; shows the raw error string in dev mode only.
- **Toasts** (`ToastContext`): the app's one shared async feedback mechanism — bottom-right, 4 tones (info/success/warn/danger), auto-dismiss after 3.5s. The most consistently reused pattern in the app (see section 4).
- **FeedbackWidget**: floating button, bottom-right (offset above the tab bar on mobile), present on every authenticated screen — dealer and admin alike — via `AppLayout`.

---

## 4. Consistency notes

### Patterns that repeat well

- **AppLayout + PageTop** is the load-bearing shell for all 11 authenticated screens (6 dealer + 5 admin) — identical title/subtitle/right-actions header contract everywhere, and the same `useMediaQuery('(max-width: 768px)')` breakpoint drives the Sidebar↔MobileNav swap consistently (used in both `AppLayout` and `FeedbackWidget`).
- **Loading skeleton + empty-state styling is copy-pasted byte-for-byte** across `Searches`, `AlertHistory`, `AdminStands`, `AdminLogs`, `AdminFeedback`: the exact same inline style object (`padding: '48px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--dust)'`) for empty states, and the same pulsing rounded-rectangle skeleton (`animation: 'pulse 1.5s ease-in-out infinite'`) for loading. Strong visual consistency, even though it was hand-repeated rather than extracted into a shared component.
- **Async write feedback** consistently pairs a toast (success/warn/danger/info) with a button-label swap ("A guardar…", "A enviar…", "A eliminar…", "A convidar…", "A exportar…") + `disabled` for the in-flight state — followed by nearly every write action across Searches, CreateSearch, AlertHistory, Settings, IsvCalculator, and all 5 admin pages.
- **`Primitives.jsx`** (`Seg`/`Pill`/`Dot`/`Btn`/`Icon`/`Switch`/`NumPair`) is the real shared vocabulary of the product — it, not the `ui/` barrel, is what gives Dashboard, Searches, CreateSearch, AlertHistory, IsvCalculator and every admin screen a coherent look.
- **Destructive actions are gated by `ConfirmDialog`** with `danger` styling and an explicit consequence description, before the mutation runs (delete search, delete account, remove member) — consistent, if not maximally strict (see section 5).
- PT-PT copy tone is consistent: short, complete sentences, present-continuous "A …ar…" for in-flight states.

### Inconsistencies found in the code

- **Two parallel component kits, not sharing implementations.** In every case below, only one side is actually used by pages, yet `Sidebar.jsx` itself imports `SieveMark` from `Logo.jsx` and `Icon` from `Primitives.jsx` in the same file — i.e. even a single file mixes both kits:
  - `Button.jsx` (supports `variant="secondary"`, no icon slot, has `fullWidth`) vs. Primitives' `Btn` (supports `icon`/`iconRight`, no `secondary` variant, no `fullWidth`) — different prop APIs for the same visual family.
  - `Badge.jsx` (`variant="success"|"warn"|"primary"|"danger"`) vs. Primitives' `Pill` (`tone="emerald"|"amber"|"coral"`) — same underlying CSS classes, different prop vocabulary, only `Pill` is used.
  - `Toggle.jsx` vs. Primitives' `Switch` — only `Switch` is used.
  - `SegmentedControl.jsx` vs. Primitives' `Seg` — only `Seg` is used.
  - `Card.jsx` vs. the raw `.card` className used directly — only the raw className is used.
  - `Logo.jsx` and `Primitives.jsx` each independently implement `SieveMark`/`Wordmark` (near-identical, not shared).
- **Login.jsx and Signup.jsx use neither kit** — raw `<input className="input">` / `<button className="btn btn--primary">` HTML, a third, uncomponentized style for the same visual language used everywhere else.
- **Two icon systems.** Core/admin pages and `Sidebar` use the hand-rolled path-based `Icon` from `Primitives.jsx`; `MobileNav`, `VerifyEmail`, `FeedbackWidget`, `Callout`, and `ToastContext` import icons from `lucide-react` directly. Concretely: the Sidebar renders "Pesquisas" with the custom sieve-dot mark and "Dashboard" with a custom sparkle glyph, while MobileNav renders the same two nav items with lucide's generic `Search` and `LayoutDashboard` — **the identical nav item has two different icons depending on viewport width.**
- **Error-surface inconsistency for failed reads.** The same underlying situation (a fetch fails) is communicated differently depending on the screen: toast + empty fallback (Searches, AlertHistory, AdminStands, AdminLogs, AdminFeedback); a `Callout` block (ResetPassword's invalid-link state only); or silently swallowed with no visible feedback at all (Settings' `getProfile`/`getCompany` reads). AdminOverview adds a fourth variant, where loading and error are visually identical.
- **`ResetPassword.jsx` imports `Callout` and uses it for 2 of its 4 states, then reverts to a hand-written `<p style={{color:'var(--coral)'}}>`** for its own password-mismatch and generic catch-block errors, in the same file. `FormField`'s own `error` prop (built for exactly this) is never actually used by either of its two consumers (`ForgotPassword`, `ResetPassword`) — both hand-roll an error `<p>` as a child instead of passing `error=`.
- **`Callout`'s `info`/`warn` variants reference tokens that don't exist**: `--color-info-bg`, `--color-info-text`, `--color-warn-bg`, `--color-warn-text` are not defined anywhere in `tokens.css` or any stylesheet (currently latent — nothing in the app uses those two variants). The `danger` variant, which **is** used (ResetPassword's invalid-link Callout), is itself half-broken: `--color-danger-bg` is also undefined (only `--color-danger-text` exists as a legacy alias), so that Callout renders with coral text/icon but **no background tint**.
- **A second, disjoint set of missing tokens** is referenced by `Toggle.jsx`, `SegmentedControl.jsx`, `PlatformCheckbox.jsx` and `StepIndicator.jsx`: `--color-bg-card`, `--shadow-sm`, `--accent`, `--accent-dim`, `--surface-3`, `--text-muted`, `--border-subtle` — none exist in `tokens.css`. These are exactly the components with zero usage in the app (section 1), so nothing currently visible is broken by it, but roughly a third of the checked-in `ui/`+`forms/` library would not render correctly against the current token set if picked up today.
- **Three unrelated implementations of "a card with a big number, a label, and a trend line"**: `StatCard.jsx` (unused), Dashboard's `.dash-hero__card` (bespoke CSS in `global.css`), and AdminOverview's `.admin-stat` (bespoke CSS in `admin.css`) — different number sizes (34px vs. 26px), different trend placement, no shared code.
- **Uneven responsive coverage below the shell.** The Sidebar↔MobileNav swap at 768px is consistent everywhere, but content-grid breakpoints only exist for `.login-left/right`, `.form-grid-2`, `.dash-hero`, `.create-grid`, and Landing's `.hero__row`/`.features__grid`. `admin.css` and most of `app.css` (`.dash-pipeline`, `.dash-grid-2`, `.isv`) define **zero** `@media` rules — so Dashboard's lower sections and every Admin screen's multi-column grids do not reflow on narrow viewports. Concretely: CreateSearch's `.create-grid` (form + sticky panel) collapses to one column under 900px, but IsvCalculator's structurally identical `.isv` grid (form + sticky panel) has no breakpoint at all and stays two-column at any width — a `.isv-grid` class with a correct 860px breakpoint exists in `global.css` but is dead CSS, never referenced by any component (IsvCalculator uses `className="isv"`, from `app.css`, not `"isv-grid"`).
- **Desktop vs. mobile alert-count semantics differ for the same nav item.** Sidebar shows a plain running total (`getAlerts({limit:500}).length`) next to "Histórico de alertas"; MobileNav shows a realtime "unread since this session" badge fed by `AlertsContext`'s Supabase subscription. The unread badge is also never cleared by visiting `/alerts` — `AlertsContext` exports `clearUnread`, but nothing in the codebase calls it, so on mobile the badge only resets when the tab closes or the company changes, not when the user reads their alerts.
- **AlertHistory's "Todos / Abertos / Descartados" `Seg`** sets a `view` state that the filtering `useMemo` never reads — selecting anything but the default currently changes nothing on screen.
- Sidebar's brand mark is not a link (no `to`/`href`/`onClick`); Landing's nav brand mark is (`<Link to="/">`) — the same lockup is interactive in one place and inert in the other.
- `NotFound.jsx` is the only screen using the legacy alias `var(--page)` instead of `var(--obsidian)`, which every other screen reaches for directly.

---

## 5. Gaps / open UX questions

These need a founder/CPO call — flagged, not decided:

1. **Alert triage has a backend and a data model, but no UI.** `alertsService.js` exports a tested `updateAlertStatus(id, userStatus)` (statuses like `contacted`/`dismissed`), the README describes it as a real, shipped behavior ("the team shares one alert queue... `status_changed_by` records who saved/dismissed"), Dashboard's mock pipeline shows a "Marcados para seguir" stage, and AlertHistory's own filter literally offers "Abertos / Descartados" — but no page anywhere calls `updateAlertStatus`, and clicking an alert row only opens the external listing in a new tab. Is per-alert triage (save/dismiss/mark contacted) scoped for a near-term release, and if so, does it belong on the AlertHistory row itself, or a detail view that doesn't exist yet?

2. **Platform admins see the full dealer navigation and can open dealer screens**, even though the README states admins "belong to no company and have no access to dealer business data." Since `ProtectedRoute` doesn't gate by role, an admin can click "Pesquisas" and land on the "Ainda não tem pesquisas. Crie a primeira." onboarding flow, which doesn't apply to them. Should platform admins see the dealer nav items at all, or should the app hide/redirect them away from dealer routes?

3. **Account deletion has no typed confirmation**, even though `ConfirmDialog` already supports a "type X to confirm" safety mode (`confirmText` prop) and the copy itself calls the action irreversible ("Todos os dados... serão permanentemente apagados. Esta ação é irreversível."). Is a single click inside a modal enough friction for permanent account/data deletion, or should this (and/or "Remover membro") require typing a confirmation phrase?

4. **Dashboard has no live data at all** — every figure is a hardcoded constant, with no service call to swap in later. Is that intentional (a placeholder pending real analytics) or was it assumed to already be wired up? This is the first screen a dealer sees after login, so it affects what "day one" actually looks like for a new account (it will show the same "34 alerts this week" for every account, forever, until this is built).

5. **AdminBilling is a full mock pending Stripe** (per its own code comment), and **AdminOverview mixes 2 real KPI tiles' worth of data with a fully mocked chart + source-health panel**, with no visual signal distinguishing live from illustrative numbers on either screen. Should mocked admin panels carry a "preview / not live" label until they're wired up, so an admin doesn't act on a fabricated MRR or a fabricated "Hey.car degraded" status?

6. **IsvCalculator's "Guardar estimativa" and "Importar histórico" don't persist or fetch anything** — they show a success/"em breve" toast without calling a service. Is ISV-estimate persistence and marketplace-URL import intended for a later iteration? If a dealer clicks "Guardar estimativa" today, the toast says it worked but nothing is saved — worth a product call on whether that button should be hidden/disabled until the save path is real.

7. **`/signup` is a dead-end route** nothing in the app links to. Keep it reachable (for old bookmarks/search indexing) as-is, or redirect it to `/login` now that self-signup is fully replaced by admin invites?

8. Roughly half of the `ui/`+`forms/` component library (`Badge`, `Card`, `SegmentedControl`, `Slider`, `StatCard`, `StepIndicator`, `Toggle`, `CurrencyInput`, `PlatformCheckbox`) is unused, and some of it maps to product ideas that aren't in the shipped UI today — a range `Slider` for margin/alert thresholds (currently plain number inputs), a visual `StepIndicator` for CreateSearch's 4-step form (currently plain "01/04" text), a `CurrencyInput` with an inline € prefix (currently absent from every money field while typing). Worth a quick pass to confirm none of these represent an abandoned decision worth reviving, versus just leftover scaffolding safe to remove as tech debt.
