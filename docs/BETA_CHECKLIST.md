# Crivo — Pre-Beta Smoke Checklist

A checkbox-driven runbook for bringing up a **live** Supabase project and
validating the full path before the free closed beta. Work top to bottom; each
step states the **Action** and the **Expected result**. Run section D against
the **live project, not mock mode** (i.e. with `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY` set — with no env vars the app silently runs in mock
mode and none of this exercises real data).

Section E (the data contract) is the most important: the ingestion team must
populate the `alerts` columns in the exact units listed there or the numbers the
dealer sees will be wrong.

---

## A. Provision Supabase

- [ ] **Create the project.** Action: create a new Supabase project; note the
      project ref (`<PROJECT-REF>`), the project URL
      (`https://<PROJECT-REF>.supabase.co`), the **anon** key and the
      **service_role** key. Expected: project is healthy and the SQL Editor is
      reachable.

- [ ] **Apply migrations in order (001 → 007).** Action: run the SQL files in
      `supabase/migrations/` in numeric order via the SQL Editor, or
      `supabase db push`. Order matters: 003 fixes the audit RLS policy created
      in 002, and 005 depends on the `alerts` table from 001.
      - `001_initial_schema.sql` — `profiles`, `searches`, `alerts`, RLS, the
        `handle_new_user` signup trigger, and `updated_at` triggers.
      - `002_audit_log.sql` — `audit_logs` table + admin-only select policy.
      - `003_fix_audit_rls_and_status.sql` — recreates the audit select policy
        to read the role from the JWT (`auth.jwt() -> 'app_metadata' ->> 'role'`).
      - `004_alert_lifecycle.sql` — adds `alerts.user_status`
        (`new` / `saved` / `dismissed`) + owner-update policy.
      - `005_realtime_alerts.sql` — adds `public.alerts` to the
        `supabase_realtime` publication.
      - `006_notification_cron.sql` — **commented-out** cron snippet only;
        applying it is a no-op (see step "Schedule daily-summary" below).
      - `007_feedback.sql` — `feedback` table + owner-insert / admin-select
        policies (backs the in-app feedback widget).
      Expected: no SQL errors; the three tables plus `audit_logs` and
      `feedback` exist.

- [ ] **Disable public self-signup (invite-only beta).** Action: Dashboard →
      Authentication → Sign In / Up → turn **off** "Allow new users to sign
      up". The frontend no longer shows a signup form (the `/signup` page is an
      invite notice), but the UI removal alone is not enforcement — only this
      setting makes the public API reject self-signups too. Admin invites via
      `auth.admin.inviteUserByEmail` (Admin panel → Stands → "Convidar
      utilizador", or Dashboard → Authentication → Users → "Invite user") keep
      working with signups disabled; invited users receive an email link to set
      their password. Expected: setting saved; direct `supabase.auth.signUp`
      calls return an error while invites still go out.

- [ ] **Verify realtime is enabled on `alerts`.** Action: 005 already adds the
      table to the publication. Confirm with:
      ```sql
      select * from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = 'alerts';
      ```
      Expected: one row returned. (Realtime in the app filters by
      `user_id=eq.<id>` — see `src/context/AlertsContext.jsx`.)

- [ ] **Deploy the five edge functions.** Action — note that `notify-alert`,
      `daily-summary` and `notify-feedback` are called by a webhook / cron (not
      a logged-in user), so they deploy with `--no-verify-jwt`; the admin
      functions deploy plain:
      ```bash
      supabase functions deploy update-user-role
      supabase functions deploy delete-account
      supabase functions deploy notify-alert --no-verify-jwt
      supabase functions deploy daily-summary --no-verify-jwt
      supabase functions deploy notify-feedback --no-verify-jwt
      ```
      Expected: all five show as deployed in Dashboard → Edge Functions.

- [ ] **Set the function secrets.** Action:
      ```bash
      supabase secrets set \
        WEBHOOK_SECRET=<random-string> \
        RESEND_API_KEY=<resend-key> \
        ALERT_FROM_EMAIL=alertas@crivo.pt \
        ALLOWED_ORIGIN=<app-origin> \
        FEEDBACK_EMAIL=<admin-inbox>
      ```
      `FEEDBACK_EMAIL` is the inbox that receives new-feedback notifications
      from `notify-feedback`; without it the function returns
      `{ "sent": false }` and skips sending.
      `ALERT_FROM_EMAIL` is optional (defaults to `alertas@crivo.pt`).
      `ALLOWED_ORIGIN` is optional and pins the CORS origin of all four edge
      functions to the deployed app (e.g. `https://app.crivo.pt`); unset, it
      defaults to `*` (fine for local dev, set it for production).
      `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.
      Without `RESEND_API_KEY` the email helper only logs the composed message
      and returns `{ "sent": false }` — safe, but no real emails. Expected:
      `supabase secrets list` shows `WEBHOOK_SECRET`, `RESEND_API_KEY`,
      `ALERT_FROM_EMAIL`, `ALLOWED_ORIGIN`.

- [ ] **Set the Auth minimum password length to 8.** Action: Dashboard →
      Authentication → Providers → Email → "Minimum password length" → **8**
      (Supabase defaults to 6). The client forms (signup, login, reset) all
      validate 8+, so the server must match or short passwords created via the
      API would slip through. Expected: signup with a 7-character password is
      rejected by the API.

- [ ] **Create the Database Webhook for instant alerts.** Action: Dashboard →
      Database → Webhooks → Create.
      - Table: `alerts`, event: **INSERT**.
      - Type: HTTP request, method **POST**, URL:
        `https://<PROJECT-REF>.supabase.co/functions/v1/notify-alert`.
      - Add an HTTP header `x-webhook-secret` whose value equals the
        `WEBHOOK_SECRET` secret.
      Expected: webhook saved. (`notify-alert` rejects with 401 if the header is
      missing or wrong; it only sends when the alert's `search_id` resolves to
      an **active** search with `alert_channels.email = true`.)

- [ ] **Create the Database Webhook for feedback notifications.** Action: same
      as the alerts webhook, but table `feedback`, event **INSERT**, URL
      `https://<PROJECT-REF>.supabase.co/functions/v1/notify-feedback`, with
      the same `x-webhook-secret` header. Expected: submitting feedback in the
      app emails `FEEDBACK_EMAIL`, and the entry appears in **Admin →
      Feedback** for triage (approve → copy the Claude prompt → mark resolved).

- [ ] **(Optional) Schedule the daily digest.** Action: 006 ships the snippet
      commented out because the URL and secret are project-specific. To enable,
      enable the `pg_cron` and `pg_net` extensions, then run (replacing
      `<PROJECT-REF>` and `<WEBHOOK-SECRET>`):
      ```sql
      create extension if not exists pg_cron;
      create extension if not exists pg_net;

      select cron.schedule(
        'crivo-daily-summary',
        '0 8 * * *', -- 08:00 UTC; use '0 7 * * *' for 08:00 Lisbon in summer
        $$
        select net.http_post(
          url     := 'https://<PROJECT-REF>.supabase.co/functions/v1/daily-summary',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-webhook-secret', '<WEBHOOK-SECRET>'
          ),
          body    := '{}'::jsonb
        );
        $$
      );
      ```
      pg_cron runs in UTC (Lisbon is UTC+0 winter / UTC+1 summer). Expected:
      `select * from cron.job;` lists `crivo-daily-summary`.

---

## B. Email deliverability (Resend)

- [ ] **Verify the sending domain.** Action: in Resend, add the domain used by
      `ALERT_FROM_EMAIL` (e.g. `crivo.pt`) and add the SPF + DKIM DNS records it
      provides. Expected: the domain shows **Verified** in Resend.

- [ ] **Send a Resend test email.** Action: use Resend's "Send test" (or a curl
      to `https://api.resend.com/emails` with the `RESEND_API_KEY`) from the
      verified `from` address to your own inbox. Expected: the email arrives in
      the **inbox, not spam**. If it lands in spam, recheck SPF/DKIM before the
      beta.

---

## C. Deploy frontend

- [ ] **Set frontend env vars.** Action: set on the host (Vercel/Netlify/etc.):
      - `VITE_SUPABASE_URL` = `https://<PROJECT-REF>.supabase.co`
      - `VITE_SUPABASE_ANON_KEY` = the anon key
      - `VITE_SENTRY_DSN` (optional) = Sentry DSN to enable error monitoring;
        leave unset to keep Sentry disabled.
      Expected: build picks them up (Vite inlines `VITE_*` at build time, so
      rebuild after changing them).

- [ ] **Build and deploy.** Action: `npm run build` and deploy `dist/`.
      Expected: the site loads and the login page renders (not mock mode — you
      should have to actually log in).

- [ ] **Confirm SPA deep-links work.** Action: log in, navigate to `/isv`, then
      **hard-refresh** the page. Expected: the page re-renders instead of a 404.
      If you get a 404, add a SPA rewrite/fallback so all routes serve
      `index.html` (`/isv`, `/alerts`, `/admin`, etc. are client-side routes).

---

## D. End-to-end functional smoke (live project, NOT mock mode)

> Run with the frontend pointed at the live Supabase project. Have two email
> inboxes ready (a primary dealer account and a second account you will promote
> to admin).

1. [ ] **Invite the dealer account.** Action: public self-signup is disabled
       (the `/signup` page is just an invite notice), so invite the dealer
       account from Dashboard → Authentication → Users → "Invite user" (or,
       once an admin account exists, from the Admin panel → Stands →
       "Convidar utilizador"). Expected: the invite is sent.

2. [ ] **Receive the invite email.** Action: check the inbox. Expected: a
       Supabase invite email arrives with a link to accept it.

3. [ ] **Accept the invite and set a password.** Action: click the invite link
       and set a password (**at least 8 characters** — enforced by Supabase).
       Expected: the account is created and confirmed.

4. [ ] **Log in.** Action: log in at `/login` with the credentials. Expected:
       you land in the app (e.g. `/searches`).

5. [ ] **Verify the `profiles` row was auto-created.** Action: in the SQL Editor
       run `select id, full_name, company, nif from public.profiles;`. Expected:
       exactly one row for the new user — created by the `handle_new_user`
       trigger from migration 001. (Invited users have no signup-form metadata,
       so `full_name` / `company` / `nif` may be empty — that is expected.)

6. [ ] **Create a search.** Action: in the app create a search; make sure its
       status is **active** and that **email alerts are enabled** for it (so the
       notify-alert email can fire later). Expected: the search appears in the
       list. Note its `id` (`select id, title, status, alert_channels from
       public.searches;`).

7. [ ] **Seed a test alert.** Action: run the seed script for this user + search:
       ```bash
       SUPABASE_URL=https://<PROJECT-REF>.supabase.co \
       SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
       TEST_USER_ID=<user-id> \
       TEST_SEARCH_ID=<search-id> \
       node scripts/seed-test-alert.mjs
       ```
       (or `npm run seed:alert` with those vars exported). Expected: it prints
       the inserted alert id.

8. [ ] **Realtime toast + unread badge.** Action: keep the app open as that user
       while running step 7. Expected: a toast `Novo alerta: …` appears and the
       **Alertas** unread badge increments by one (`AlertsContext` listens for
       `INSERT` filtered by `user_id`).

9. [ ] **Alert email arrives.** Action: check the dealer inbox. Expected: an
       email `Novo alerta Crivo: BMW 330e Touring (teste beta)` arrives — only
       if `RESEND_API_KEY` is set, the search is **active**, and its
       `alert_channels.email = true`. If any of those is false, no email is sent
       by design.

10. [ ] **Open `/alerts`; verify ISV & margin render and look sane.** Action: go
        to the Alertas page. Expected: the seeded alert shows an estimated ISV
        and a **positive** margin (`market_price − price_original − ISV −
        transport_est`). For the seeded PHEV (cc 1998, CO₂ 36, Gasolina, 3 yrs,
        price 28 500, market 37 500, transport 800) the margin should be clearly
        positive. ISV and margin are computed **in the browser**, not stored.

11. [ ] **Save then dismiss the alert (lifecycle).** Action: use the alert's
        save and dismiss controls. Expected: `alerts.user_status` goes
        `new → saved → dismissed` (migration 004); verify with
        `select user_status from public.alerts;`.

12. [ ] **Settings → change password.** Action: in Settings, change the password.
        Expected: success toast; you can log in again with the new password.

13. [ ] **Settings → export data.** Action: click Export. Expected: a
        `crivo-dados-YYYY-MM-DD.json` file downloads containing `user`,
        `profile`, `searches` and `alerts` arrays for this user.

14. [ ] **Create a second account and promote it to admin.** Action: invite a
        second account (Dashboard → Authentication → Users → "Invite user")
        and accept the invite; in Dashboard → Authentication → Users, set its
        `app_metadata` to `{"role":"admin"}`. Expected: saved. (Log out/in so
        the new JWT carries the role.)

15. [ ] **Admin panel loads with stats, users and audit log.** Action: log in as
        the admin and open `/admin`. Expected: the dashboard shows stats
        (total users, active/total searches, alerts 7d / total), a paginated
        user list, and an audit log. Promote/demote a user from the panel, then
        confirm the **audit log shows the `role_change`** row (admin id, target
        id, old → new value). (Admin access is gated on `app_metadata.role ===
        'admin'`; non-admins are redirected to `/searches`.)

---

## E. Data-contract verification (the cross-team seam) — MOST IMPORTANT

The ingestion/scraper team writes rows into **`public.alerts`** (via the
service role — there is no client insert policy). The frontend reads these
columns through `src/lib/mappers.js#mapAlert` and computes **ISV and margin in
the browser** (`src/lib/isv.js`, used by `src/pages/AlertHistory.jsx`). If a
field is wrong or in the wrong unit, the displayed numbers are wrong even
though nothing errors.

Margin shown to the dealer is:

```
margin = market_price − (price_original + ISV + transport_est)
```

ISV is a function of `cc`, `co2`, `fuel_type`, `age_years` and the `PHEV`
flag (see notes below the table).

| Column | Type | Unit / allowed values | Nullable | Notes |
|---|---|---|---|---|
| `user_id` | uuid | the alert owner's `auth.users.id` | **no** | Drives realtime delivery and RLS owner-select. Must be a real user. |
| `search_id` | uuid | references `public.searches.id` | yes (FK `on delete set null`) | **Required for the email** — `notify-alert` returns "no search" if null. Realtime/UI work without it. |
| `car_title` | text | free text, e.g. `"BMW 330e Touring"` | **no** | Used in the toast, the alert row, and the email subject. |
| `platform` | text | marketplace name, e.g. `"Mobile.de"`, `"AutoScout24"` | **no** | Shown in UI and emails. |
| `listing_url` | text | absolute URL to the listing | yes | Rendered as the "Ver anúncio" link. |
| `price_original` | integer | **whole euros** (advertised price) | **no** | Added into total landed cost. |
| `cc` | integer | engine displacement in **cm³** | yes | ISV cylinder-capacity component. Null ⇒ treated as 0 ⇒ floor of €100 applies. |
| `co2` | integer | **g/km, WLTP** | yes | ISV CO₂ component; also the PHEV-reduction trigger (`co2 <= 50`). |
| `fuel_type` | text | see fuel-type note below | yes | Only the exact value `"Diesel"` switches ISV to the diesel CO₂ table; everything else uses the petrol table. |
| `age_years` | integer | **whole years** since first registration | yes | Selects the ISV age-discount bracket (7+ → 55% … 0 → 0%). |
| `transport_est` | integer | **whole euros** | **no** (default 800) | Added into total landed cost. |
| `market_price` | integer | **whole euros** (PT resale estimate) | yes | The minuend of the margin calc. Null ⇒ margin can't be computed sensibly. |
| `flags` | text[] | array of tags; `"PHEV"` is significant | **no** (default `{}`) | `flags.includes('PHEV')` is **the only** PHEV signal for ISV; other flags render as a risk pill. |
| `user_status` | text | `new` \| `saved` \| `dismissed` | **no** (default `new`) | User-controlled lifecycle; ingestion should leave it `new` / unset. |
| `date` | text | free label, e.g. `"Today"` | **no** (default `'Today'`) | Display label only; not a real date. |
| `created_at` | timestamptz | set by DB default `now()` | **no** | Used for ordering and 24h/7d windows; let the DB set it. |

**Fuel-type note (derived from `src/lib/isv.js`).** The ISV calc does:
`isDiesel = (fuel_type === 'Diesel')`. So:
- `fuel_type === 'Diesel'` → diesel CO₂ table.
- **anything else** (e.g. `'Gasolina'`, `'Híbrido (PHEV)'`, `'Elétrico'`, or
  null) → petrol CO₂ table.
The calculator UI offers `Diesel`, `Gasolina`, `Híbrido (PHEV)`, `Elétrico`.
Match `'Diesel'` exactly (case-sensitive) for diesel pricing.

**PHEV note.** PHEV is detected **only** via the `flags` array
(`flags.includes('PHEV')`), **not** via `fuel_type`. When a car is a PHEV and
`co2 <= 50`, the ISV is multiplied by 0.25. So for a plug-in hybrid the
ingestion team must put `"PHEV"` in `flags` **and** populate a low `co2` —
relying on `fuel_type = 'Híbrido (PHEV)'` alone will **not** trigger the
reduction.

**Non-EU note.** The calc supports a "non-EU" flag that disables the age
discount, but the alert page hard-codes it to `false` — there is no `alerts`
column for it today. All beta alerts are treated as EU imports.

> Bottom line for ingestion: populate `cc` (cm³), `co2` (g/km WLTP), prices and
> `transport_est` (whole euros), `age_years` (integer years), the exact
> `fuel_type` string, and `flags` (with `"PHEV"` where applicable). These are
> the inputs the browser turns into the ISV and margin the dealer trusts.

---

## F. Known limitations for the beta

- **WhatsApp not implemented.** Email is the only delivery channel. The
  `alert_channels.whatsapp` flag is read but there is a TODO in
  `supabase/functions/notify-alert/index.ts` — WhatsApp Business API credentials
  are not wired up. Daily summary is email-only too.
- **No billing.** This is a free closed beta; there is no subscription, metering
  or paywall.
- **No rate limiting / CAPTCHA.** The `/isv` calculator has no rate limiting or
  bot protection. Public self-signup is disabled (invite-only beta), which
  removes the signup abuse surface.
- **Password minimum is 8 characters.** Enforced by Supabase Auth; invited
  users set their password via the invite-email link. No other complexity
  rules.
- **Admin enforcement requires `app_metadata`.** Admin access depends on
  `app_metadata.role === 'admin'` on the user (set in the Dashboard). The
  frontend route guard and the `update-user-role` function and the `audit_logs`
  RLS all read this from the JWT — a user with no role is a normal dealer.

---

## G. Rollback / support

- **Disable instant alert emails.** Action: Dashboard → Database → Webhooks →
  disable or delete the `alerts` INSERT webhook. Realtime toasts and the UI keep
  working; only the email stops. (You can also rotate `WEBHOOK_SECRET` to
  invalidate the webhook immediately.)
- **Stop the daily digest.** Action: if you scheduled it (section A), run:
  ```sql
  select cron.unschedule('crivo-daily-summary');
  ```
  (See the comment block in `supabase/migrations/006_notification_cron.sql`.)
- **Disable error monitoring.** Action: unset `VITE_SENTRY_DSN` and rebuild.
- **Support contact:** suporte@crivo.pt
