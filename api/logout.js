import { clearSessionCookie } from "../lib/session.js";

export function POST() {
  const headers = new Headers({ Location: "/login", "Cache-Control": "no-store" });
  headers.append("Set-Cookie", clearSessionCookie());
  return new Response(null, { status: 303, headers });
}
