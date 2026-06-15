// Shared auth helpers for Crivo edge functions.

// Constant-time string comparison for secret/token checks.
//
// Returns false immediately on a length mismatch (length is not secret here),
// and otherwise XOR-accumulates over the UTF-8 bytes of both strings without
// early-returning on the first differing byte. This avoids leaking how many
// leading characters of a guessed secret are correct via response timing.
//
// Deno's crypto.subtle.timingSafeEqual is not guaranteed to be present, so we
// implement the byte-level comparison manually for portability.
export function timingSafeEqualStr(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;

  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}
