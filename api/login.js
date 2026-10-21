import { createSession, sessionCookie } from "../lib/session.js";
import { checkPassword, json } from "../lib/password.js";

export async function POST(request) {
  const failed = await checkPassword(request);
  if (failed) return failed;

  const token = await createSession(process.env.SESSION_SECRET);
  return json(200, { ok: true }, [sessionCookie(token)]);
}
