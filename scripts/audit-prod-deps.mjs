// audit-prod-deps.mjs
// ----------------------------------------------------------------------------
// Runs `npm audit` against production dependencies only and fails on any
// high/critical advisory, EXCEPT the ones explicitly allowlisted below. Plain
// `npm audit --audit-level=high` can't distinguish "vulnerable version range"
// from "vulnerable code path we actually exercise" — this lets CI stay strict
// while not blocking merges on advisories we've verified don't apply to us.
//
// Allowlist entries must carry a reason and a revisit condition; anything not
// listed here still fails the build.
import { execFileSync } from 'node:child_process'

const ALLOWED_ADVISORIES = {
  'GHSA-qwww-vcr4-c8h2': {
    title: 'React Router: RSC Mode CSRF Bypass Allows Action Execution Before 400 Response',
    reason:
      "Advisory text: \"This only affects your application if you are using the unstable RSC APIs.\" " +
      'This app is a Vite SPA using plain BrowserRouter/Routes/Route (declarative mode) — no RSC, ' +
      'no loaders/actions, no framework mode.',
    revisit:
      'Full fix needs react-router-dom 8.3.0+, which requires React >=19.2.7. Revisit when the app ' +
      'moves to React 19, or when a patched release lands that still supports React 18.',
  },
}

function runAudit() {
  try {
    const out = execFileSync('npm', ['audit', '--omit=dev', '--audit-level=high', '--json'], {
      encoding: 'utf8',
    })
    return JSON.parse(out)
  } catch (err) {
    // npm audit exits non-zero when it finds matching vulnerabilities; stdout still has the report.
    if (err.stdout) return JSON.parse(err.stdout)
    throw err
  }
}

const report = runAudit()
const vulnerabilities = report.vulnerabilities ?? {}

const foundIds = new Set()
for (const vuln of Object.values(vulnerabilities)) {
  for (const via of vuln.via ?? []) {
    if (typeof via === 'object' && via.url) {
      foundIds.add(via.url.split('/').pop())
    }
  }
}

const unexpected = [...foundIds].filter((id) => !ALLOWED_ADVISORIES[id])

if (unexpected.length > 0) {
  console.error(`Unexpected high/critical advisories in production dependencies: ${unexpected.join(', ')}`)
  console.error('Run `npm audit --omit=dev` for details. If this is a real finding, fix it.')
  console.error('If it is a verified non-issue, add it to ALLOWED_ADVISORIES in this script with a reason.')
  process.exit(1)
}

if (foundIds.size > 0) {
  console.log('Only known/accepted advisories present, all verified not applicable to this app:')
  for (const id of foundIds) {
    console.log(`  - ${id}: ${ALLOWED_ADVISORIES[id].title}`)
    console.log(`    ${ALLOWED_ADVISORIES[id].reason}`)
    console.log(`    Revisit: ${ALLOWED_ADVISORIES[id].revisit}`)
  }
} else {
  console.log('No high/critical advisories in production dependencies.')
}
