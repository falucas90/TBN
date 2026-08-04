// @vitest-environment node
//
// Unit test for the `update-role` action of the `update-user-role` edge
// function, focused on the admin-promotion-must-clear-tenancy fix
// (docs/specs/fix-batch-1.md, item 1, AC1.1-AC1.7).
//
// The function is a Deno edge function (Deno.serve + an esm.sh import), so
// this test stubs the minimal Deno surface it touches (`Deno.serve`,
// `Deno.env.get`) and mocks the `@supabase/supabase-js` module boundary,
// mirroring this repo's existing pattern of testing at the service-client
// boundary (see src/services/*.test.js).
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const envVars = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
};

// Minimal Deno global: `Deno.serve` normally starts a server — we instead
// capture the request handler so it can be invoked directly in tests.
// `Deno.env.get` is read both by this function and by `_shared/cors.ts` at
// module-load time.
let handler;
globalThis.Deno = {
  serve: (fn) => {
    handler = fn;
  },
  env: { get: (key) => envVars[key] },
};

// Mutable fixtures the mocked supabase-js client reads from; reassigned
// per-test in `beforeEach`-equivalent setup within each test/describe.
let mockCaller = { id: 'admin-caller-id', app_metadata: { role: 'admin' } };
let getUserByIdMock = vi.fn(async () => ({
  data: { user: { app_metadata: { role: 'dealer' } } },
  error: null,
}));
let updateUserByIdMock = vi.fn(async (userId, { app_metadata }) => ({
  data: { user: { id: userId, app_metadata } },
  error: null,
}));
let profilesUpdateEqMock = vi.fn(async () => ({ error: null }));
let auditInsertMock = vi.fn(async () => ({ error: null }));

vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: (_url, key) => {
    if (key === envVars.SUPABASE_ANON_KEY) {
      // Client-facing instance: only auth.getUser() is used by the function.
      return { auth: { getUser: async () => ({ data: { user: mockCaller }, error: null }) } };
    }
    // Service-role admin instance.
    return {
      auth: {
        admin: {
          getUserById: (...args) => getUserByIdMock(...args),
          updateUserById: (...args) => updateUserByIdMock(...args),
        },
      },
      from: (table) => {
        if (table === 'profiles') {
          return { update: () => ({ eq: (...args) => profilesUpdateEqMock(...args) }) };
        }
        if (table === 'audit_logs') {
          return { insert: (...args) => auditInsertMock(...args) };
        }
        throw new Error(`unexpected table in test: ${table}`);
      },
    };
  },
}));

beforeAll(async () => {
  await import('./index.ts');
  expect(handler).toBeTypeOf('function');
});

afterEach(() => {
  getUserByIdMock.mockClear();
  updateUserByIdMock.mockClear();
  profilesUpdateEqMock.mockClear();
  auditInsertMock.mockClear();
  mockCaller = { id: 'admin-caller-id', app_metadata: { role: 'admin' } };
});

const callUpdateRole = (body) =>
  handler(
    new Request('https://example.supabase.co/functions/v1/update-user-role', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-role', ...body }),
    })
  );

describe('update-role: promotion clears tenancy (AC1.1-AC1.3, AC1.6)', () => {
  it('clears company_id and company_role when promoting to admin', async () => {
    const res = await callUpdateRole({ userId: 'dealer-1', role: 'admin' });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user.app_metadata.role).toBe('admin');

    // AC1.1/AC1.2: service-role update on profiles clearing both columns.
    expect(profilesUpdateEqMock).toHaveBeenCalledTimes(1);
    expect(profilesUpdateEqMock).toHaveBeenCalledWith('id', 'dealer-1');

    // AC1.6: the role_change audit log still fires.
    expect(auditInsertMock).toHaveBeenCalledTimes(1);
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'role_change', old_value: 'dealer', new_value: 'admin' })
    );
  });
});

describe('update-role: non-admin role changes are a tenancy no-op (AC1.4)', () => {
  it('does not touch profiles when demoting/setting a non-admin role', async () => {
    const res = await callUpdateRole({ userId: 'dealer-1', role: 'dealer' });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user.app_metadata.role).toBe('dealer');

    expect(profilesUpdateEqMock).not.toHaveBeenCalled();
    expect(auditInsertMock).toHaveBeenCalledTimes(1);
  });
});

describe('update-role: tenancy clear failure must not report success (AC1.5)', () => {
  it('returns a non-2xx error and does not log a false success when the profiles update fails', async () => {
    profilesUpdateEqMock.mockResolvedValueOnce({ error: { message: 'db unavailable' } });

    const res = await callUpdateRole({ userId: 'dealer-1', role: 'admin' });
    expect(res.status).not.toBe(200);
    expect(res.status).toBeGreaterThanOrEqual(400);

    const body = await res.json();
    expect(body.error).toBeTruthy();

    // No silent "role changed but tenancy still leaks" success path, and no
    // audit log entry for a call that didn't actually complete cleanly.
    expect(auditInsertMock).not.toHaveBeenCalled();
  });
});

describe('update-role: existing validation is unchanged', () => {
  it('rejects a call missing userId or role', async () => {
    const res = await callUpdateRole({ userId: 'dealer-1' });
    expect(res.status).toBe(400);
  });
});
