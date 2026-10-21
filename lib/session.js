// The session is an HMAC-signed cookie. Uses Web Crypto so it runs in both middleware and api.
export const SESSION_COOKIE = "hub_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

const enc = new TextEncoder();

function toBase64Url(bytes) {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text) {
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

// scope keeps tokens for different purposes apart, so one can never be used as another
const signed = (scope, payload) => enc.encode(scope ? `${scope}:${payload}` : payload);

export async function createSession(secret, { maxAge = MAX_AGE, scope = "" } = {}) {
  const exp = Math.floor(Date.now() / 1000) + maxAge;
  const id = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const payload = `${exp}.${id}`;
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), signed(scope, payload));
  return `${payload}.${toBase64Url(sig)}`;
}

export async function verifySession(token, secret, scope = "") {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [exp, id, sig] = parts;
  if (!(Number(exp) > Date.now() / 1000)) return false;
  try {
    return await crypto.subtle.verify("HMAC", await hmacKey(secret), fromBase64Url(sig), signed(scope, `${exp}.${id}`));
  } catch {
    return false;
  }
}

export function readCookie(request, name) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

export function sessionCookie(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

