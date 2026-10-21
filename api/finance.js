// Finance Management ledger (CRUD). Needs a session (middleware). GET lists, POST adds, PATCH ?id= edits, DELETE ?id= removes.
// Saved budget versions use ?type=budget: POST saves a list of versions, DELETE removes them all (reset to defaults).
import { json } from "../lib/password.js";
import { rest } from "../lib/supabase-admin.js";

const KEEP_MONTHS = 6;
const KINDS = new Set(["opening", "income", "transfer", "expense"]);
const STATUSES = new Set(["posted", "scheduled"]);
const NODE = /^[a-z][a-z0-9.]{0,31}$/;
const CATEGORY = /^[a-z]{1,24}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const COLUMNS = "id,seq,date,description,from_node,to_node,amount,fee,fee_label,kind,category,status,note";

const cutoff = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - KEEP_MONTHS);
  return d.toISOString().slice(0, 10);
};

function text(value, max, field, required = false) {
  const s = String(value ?? "").trim();
  if (required && !s) throw new Error(`${field} is required.`);
  if (s.length > max) throw new Error(`${field} is too long (${max} characters at most).`);
  return s || null;
}

function money(value, field, { min = 0, max = 1e12 } = {}) {
  const n = Number(value ?? 0);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${field} must be a whole rupiah amount.`);
  return n;
}

// Turns the browser's entry into a database row, or throws a message the form can show
function toRow(body) {
  const date = String(body.date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error("Pick a valid date.");
  if (date < cutoff()) throw new Error(`Entries older than ${KEEP_MONTHS} months aren't kept.`);
  const from = String(body.from ?? ""), to = String(body.to ?? "");
  if (!NODE.test(from) || !NODE.test(to)) throw new Error("Pick where the money comes from and goes to.");
  if (from === to) throw new Error("From and To must be different.");
  if (!KINDS.has(body.kind)) throw new Error("Pick a type.");
  const status = body.status ?? "posted";
  if (!STATUSES.has(status)) throw new Error("Pick a status.");
  if (!CATEGORY.test(String(body.category ?? ""))) throw new Error("Pick a category.");
  return {
    date,
    description: text(body.desc, 120, "Description", true),
    from_node: from,
    to_node: to,
    amount: money(body.amount, "Amount", { min: 1 }),
    fee: money(body.fee, "Fee", { max: 1e9 }),
    fee_label: text(body.feeLabel, 24, "Fee label"),
    kind: body.kind,
    category: body.category,
    status,
    note: text(body.note, 500, "Note"),
  };
}

const BUDGET_KEYS = new Set(["rent", "claude", "halo", "indihome", "fees", "pln", "food", "daily"]);

function toBudget(v) {
  const from = String(v?.from ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || Number.isNaN(Date.parse(from))) throw new Error("Pick when the new amounts start.");
  const amounts = {};
  for (const [k, n] of Object.entries(v.amounts ?? {})) {
    if (!BUDGET_KEYS.has(k)) throw new Error(`Unknown budget line: ${k}.`);
    amounts[k] = money(n, "Every amount", { max: 1e10 });
  }
  return { from_date: from, salary: money(v.salary, "Salary", { max: 1e10 }), amounts, parents_help: money(v.parentsHelp, "Parents' help", { max: 1e10 }), updated_at: new Date().toISOString() };
}

async function budgets(method, request) {
  if (method === "DELETE") {
    await rest("fm_budget_versions?from_date=not.is.null", { method: "DELETE", prefer: "return=minimal" });
    return json(200, { ok: true });
  }
  let rows;
  try {
    const body = await request.json();
    rows = (Array.isArray(body) ? body : [body]).map(toBudget);
  } catch (err) {
    return json(400, { message: err instanceof SyntaxError ? "Can't read the budget." : err.message });
  }
  if (!rows.length || rows.length > 24) return json(400, { message: "Nothing to save." });
  await rest("fm_budget_versions?on_conflict=from_date", { method: "POST", body: rows, prefer: "resolution=merge-duplicates,return=minimal" });
  return json(200, { ok: true });
}

async function list() {
  // Old entries roll into the carry-over balances first, so balances stay right after they are deleted
  await rest("rpc/fm_prune", { method: "POST", body: {} });
  const [transactions, carryover, saved] = await Promise.all([
    rest(`fm_transactions?select=${COLUMNS}&order=date.asc,seq.asc`),
    rest("fm_carryover?select=node,amount"),
    // Until sql_update.sql has run there is no budget table; the app then uses the default budgets
    rest("fm_budget_versions?select=from_date,salary,amounts,parents_help&order=from_date.asc").catch(() => null),
  ]);
  return json(200, { transactions, carryover, budgets: saved ?? [], budgetsReady: saved !== null, keepMonths: KEEP_MONTHS });
}

async function handle(request, method) {
  const query = new URL(request.url).searchParams;
  if (query.get("type") === "budget" && (method === "POST" || method === "DELETE")) {
    try { return await budgets(method, request); } catch (err) {
      console.error(err);
      return json(500, { message: "Can't save the budget. Run supabase/sql_update.sql in Supabase, then try again." });
    }
  }
  const id = query.get("id");
  if (method !== "GET" && method !== "POST" && !UUID.test(id ?? "")) return json(400, { message: "Unknown entry." });

  try {
    if (method === "GET") return await list();
    if (method === "DELETE") {
      await rest(`fm_transactions?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
      return json(200, { ok: true });
    }
    let row;
    try {
      row = toRow(await request.json());
    } catch (err) {
      return json(400, { message: err instanceof SyntaxError ? "Can't read the entry." : err.message });
    }
    const saved = method === "POST"
      ? await rest(`fm_transactions?select=${COLUMNS}`, { method: "POST", body: row, prefer: "return=representation" })
      : await rest(`fm_transactions?id=eq.${id}&select=${COLUMNS}`, { method: "PATCH", body: { ...row, updated_at: new Date().toISOString() }, prefer: "return=representation" });
    if (!saved?.length) return json(404, { message: "That entry no longer exists." });
    return json(method === "POST" ? 201 : 200, { transaction: saved[0] });
  } catch (err) {
    console.error(err);
    return json(500, { message: "Can't reach the database. Try again." });
  }
}

export const GET = (request) => handle(request, "GET");
export const POST = (request) => handle(request, "POST");
export const PATCH = (request) => handle(request, "PATCH");
export const DELETE = (request) => handle(request, "DELETE");
