// Transactions from /api/finance, shared by the Finance Management page and the printable report.
// When the database can't be reached, the page stays empty and nothing can be saved.
import { useSavedBudgets } from "./model.js";

export const data = { ledger: [], opening: {}, live: false, error: null, keepMonths: 6, loadedAt: null };

const fromRow = (r) => ({
  id: r.id, seq: Number(r.seq), date: r.date, desc: r.description, from: r.from_node, to: r.to_node,
  amount: Number(r.amount), fee: Number(r.fee) || 0, feeLabel: r.fee_label, kind: r.kind, category: r.category,
  status: r.status, note: r.note,
});

export async function request(method, query = "", body) {
  const res = await fetch(`/api/finance${query}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const out = await res.json().catch(() => ({}));
  if (res.status === 401) { location.assign(`/login?next=${encodeURIComponent(location.pathname)}`); throw new Error(out.message); }
  if (!res.ok) throw new Error(out.message ?? "Something went wrong. Try again.");
  return out;
}

export async function load() {
  try {
    const out = await request("GET");
    data.ledger = out.transactions.map(fromRow);
    data.opening = Object.fromEntries(out.carryover.map((r) => [r.node, Number(r.amount)]));
    data.keepMonths = out.keepMonths ?? data.keepMonths;
    data.budgetsReady = out.budgetsReady !== false;
    useSavedBudgets((out.budgets ?? []).map((b) => ({ from: b.from_date, salary: Number(b.salary), amounts: b.amounts, parentsHelp: Number(b.parents_help) })));
    data.live = true;
    data.error = null;
    data.loadedAt = new Date();
  } catch (err) {
    data.error = err.message;
    if (!data.live) data.ledger = [];
  }
  return data;
}

// The body the API expects for an entry
export const toBody = (t) => ({
  date: t.date, desc: t.desc, from: t.from, to: t.to, amount: t.amount, fee: t.fee || 0, feeLabel: t.feeLabel || null,
  kind: t.kind, category: t.category, status: t.status, note: t.note || null,
});

export const sortLedger = (ledger) => [...ledger].sort((a, b) => (a.date === b.date ? a.seq - b.seq : a.date.localeCompare(b.date)));
