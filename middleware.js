// Login gate: every page and /api route needs a session, except what the login page itself needs.
import { readCookie, SESSION_COOKIE, verifySession } from "./lib/session.js";

const LOGIN_PATHS = new Set(["/login", "/login.html"]);
const PUBLIC_PATHS = new Set([...LOGIN_PATHS, "/api/login", "/assets/js/login.js", "/assets/js/device-gate.js", "/favicon.ico"]);
const PUBLIC_PREFIXES = ["/assets/fonts/", "/assets/css/", "/assets/icons/", "/assets/img/"];

// Continue to the file or function. Same as next() from @vercel/functions, without the extra package.
const next = () => new Response(null, { headers: { "x-middleware-next": "1" } });

const jsonError = (status, message) => new Response(JSON.stringify({ message }), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const secret = process.env.SESSION_SECRET;

  const token = readCookie(request, SESSION_COOKIE);
  const loggedIn = Boolean(token && secret && (await verifySession(token, secret)));

  if (loggedIn && LOGIN_PATHS.has(path)) return Response.redirect(new URL("/", url), 302);

  if (loggedIn || PUBLIC_PATHS.has(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p))) return next();

  if (path.startsWith("/api/")) return jsonError(401, "Session expired. Sign in again to continue.");

  const login = new URL("/login", url);
  if (path !== "/") login.searchParams.set("next", path + url.search);
  return Response.redirect(login, 302);
}
