import { rest } from "./supabase-admin.js";
import { hmacKey } from "./session.js";

export const WINDOW_MINUTES = 15;
const MAX_FAILURES = 5;

// IPs are stored as a hash, never the real address
export async function hashIp(ip, secret) {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), new TextEncoder().encode(`ip:${ip}`));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isLocked(ipHash) {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const rows = await rest(
    `login_attempts?select=id&ip_hash=eq.${ipHash}&success=eq.false&created_at=gte.${encodeURIComponent(since)}&limit=${MAX_FAILURES}`,
  );
  return rows.length >= MAX_FAILURES;
}

export async function recordAttempt(ipHash, success) {
  await rest("login_attempts", { method: "POST", body: { ip_hash: ipHash, success }, prefer: "return=minimal" });
}

export async function clearFailures(ipHash) {
  await rest(`login_attempts?ip_hash=eq.${ipHash}&success=eq.false`, { method: "DELETE", prefer: "return=minimal" });
}
