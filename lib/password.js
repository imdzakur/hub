// Password check for sign-in, with a per-IP rate limit.
import { hmacKey } from "./session.js";
import { clearFailures, hashIp, isLocked, recordAttempt, WINDOW_MINUTES } from "./rate-limit.js";

export const MESSAGES = {
  wrong: "Incorrect password.",
  locked: `Too many attempts. Try again in ${WINDOW_MINUTES} minutes.`,
  server: "Can't check the password. Try again.",
};

export function json(status, body, cookies = []) {
  const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  cookies.forEach((c) => headers.append("Set-Cookie", c));
  return new Response(JSON.stringify(body), { status, headers });
}

function clientIp(request) {
  return request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? "unknown";
}

// Compare through HMAC so timing doesn't leak the password
async function samePassword(input, expected, secret) {
  const key = await hmacKey(secret);
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(expected));
  return crypto.subtle.verify("HMAC", key, sig, enc.encode(input));
}

// Returns null when the password is right, or the error Response to send back
export async function checkPassword(request) {
  const secret = process.env.SESSION_SECRET;
  const password = process.env.HUB_PASSWORD;
  if (!secret || !password) {
    console.error("SESSION_SECRET or HUB_PASSWORD is not set");
    return json(500, { message: MESSAGES.server });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json(400, { message: MESSAGES.server });
  }

  try {
    const ipHash = await hashIp(clientIp(request), secret);
    if (await isLocked(ipHash)) return json(429, { message: MESSAGES.locked });

    const ok = await samePassword(String(form.get("password") ?? ""), password, secret);
    await recordAttempt(ipHash, ok);
    if (!ok) return json(401, { message: MESSAGES.wrong });

    await clearFailures(ipHash);
    return null;
  } catch (err) {
    console.error(err);
    return json(500, { message: MESSAGES.server });
  }
}
