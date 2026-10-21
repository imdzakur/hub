// Server-only Supabase access over REST (PostgREST). The secret key bypasses RLS; never send it to the browser.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

export async function rest(path, { method = "GET", body, prefer } = {}) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("SUPABASE_URL or SUPABASE_SECRET_KEY is not set");

  const headers = { apikey: SUPABASE_SECRET_KEY, Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (prefer) headers.Prefer = prefer;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path.split("?")[0]} failed (${res.status}): ${await res.text()}`);

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
