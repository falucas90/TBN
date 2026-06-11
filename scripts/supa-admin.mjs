#!/usr/bin/env node
// Thin wrapper around the Supabase Management API for provisioning.
// Reads SUPABASE_ACCESS_TOKEN (and optionally SUPABASE_PROJECT_REF) from .env.
// Usage:
//   node scripts/supa-admin.mjs projects
//   node scripts/supa-admin.mjs query <file.sql | ->
//   node scripts/supa-admin.mjs api-keys
//   node scripts/supa-admin.mjs secrets-set KEY=VALUE [KEY=VALUE...]
//   node scripts/supa-admin.mjs secrets-list
//   node scripts/supa-admin.mjs functions-list

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
try {
  for (const line of readFileSync(resolve(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2]
  }
} catch { /* no .env */ }

const token = process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN
if (!token) { console.error('SUPABASE_ACCESS_TOKEN missing'); process.exit(1) }
const ref = process.env.SUPABASE_PROJECT_REF || env.SUPABASE_PROJECT_REF

const API = 'https://api.supabase.com'

async function call(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) {
    console.error(`HTTP ${res.status} ${method} ${path}\n${text}`)
    process.exit(1)
  }
  return text ? JSON.parse(text) : null
}

const [cmd, ...args] = process.argv.slice(2)
const needRef = () => { if (!ref) { console.error('SUPABASE_PROJECT_REF missing'); process.exit(1) } }

if (cmd === 'projects') {
  const ps = await call('GET', '/v1/projects')
  for (const p of ps) console.log([p.id, p.name, p.region, p.status, p.created_at].join(' | '))
} else if (cmd === 'query') {
  needRef()
  const sql = args[0] === '-' ? readFileSync(0, 'utf8') : readFileSync(resolve(root, args[0]), 'utf8')
  const out = await call('POST', `/v1/projects/${ref}/database/query`, { query: sql })
  console.log(JSON.stringify(out, null, 2))
} else if (cmd === 'api-keys') {
  needRef()
  const keys = await call('GET', `/v1/projects/${ref}/api-keys`)
  for (const k of keys) console.log(`${k.name}=${k.api_key}`)
} else if (cmd === 'secrets-set') {
  needRef()
  const secrets = args.map(a => {
    const i = a.indexOf('=')
    return { name: a.slice(0, i), value: a.slice(i + 1) }
  })
  await call('POST', `/v1/projects/${ref}/secrets`, secrets)
  console.log('ok')
} else if (cmd === 'secrets-list') {
  needRef()
  const s = await call('GET', `/v1/projects/${ref}/secrets`)
  for (const x of s) console.log(x.name)
} else if (cmd === 'functions-list') {
  needRef()
  const fs = await call('GET', `/v1/projects/${ref}/functions`)
  for (const f of fs) console.log([f.slug, f.status, `verify_jwt=${f.verify_jwt}`, `v${f.version}`].join(' | '))
} else {
  console.error('unknown command'); process.exit(1)
}
