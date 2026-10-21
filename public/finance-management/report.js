// Printable finance report for one day (?day=YYYY-MM-DD) or one period (?period=<payday ISO>), laid out like a
// simple accountant's statement: summary, balances by account, spending by category, journal, and what's still planned.
// The browser's print window turns it into a PDF, with the same fonts as the app.
import { ACCOUNTS, BUDGET_LINES, CATEGORIES, LINE_GROUPS, NODES, POCKETS, SALARY } from "./model.js";
import * as c from "./calc.js";
import { data, load, sortLedger } from "./data.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const money = (v) => (v ? `${v < 0 ? "(" : ""}${c.fmtPlain(Math.abs(v))}${v < 0 ? ")" : ""}` : "–"); // accountants put negatives in brackets
const label = (id) => NODES[id]?.label ?? id;
const catLabel = (id) => CATEGORIES[id]?.label ?? "Others";

function range() {
  const q = new URLSearchParams(location.search);
  const day = q.get("day");
  if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) return { kind: "day", startISO: day, endISO: day, title: `Daily statement · ${c.fmtWeekday(day)}, ${c.fmtDate(day)}` };
  const start = q.get("period");
  const p = c.periodOf(start && /^\d{4}-\d{2}-\d{2}$/.test(start) ? c.toDate(start) : new Date());
  return { kind: "period", startISO: p.startISO, endISO: p.endISO, period: p, title: `Period statement · ${c.fmtDate(p.start)} – ${c.fmtDate(p.end)}` };
}

const dayBefore = (iso) => c.toISO(c.addDays(c.toDate(iso), -1));
const internal = Object.keys(NODES).filter((id) => !NODES[id].external);

function table(head, rows, foot = "") {
  return `<table class="rp-table"><thead><tr>${head.map((h) => `<th${h.num ? ' class="num"' : ""}>${esc(h.t ?? h)}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${head.length}" class="rp-empty">None.</td></tr>`}</tbody>${foot ? `<tfoot>${foot}</tfoot>` : ""}</table>`;
}

function render() {
  const r = range();
  const ledger = sortLedger(data.ledger);
  const done = ledger.filter((t) => c.isPosted(t) && t.date >= r.startISO && t.date <= r.endISO);
  const planned = ledger.filter((t) => !c.isPosted(t) && t.date >= r.startISO && t.date <= r.endISO);
  const open = c.balances(ledger, { upTo: dayBefore(r.startISO), opening: data.opening });
  const close = c.balances(ledger, { upTo: r.endISO, opening: data.opening });
  const sumOf = (bal) => internal.reduce((t, id) => t + (bal[id] ?? 0), 0);

  const income = done.filter((t) => t.kind === "income").reduce((s, t) => s + t.amount, 0);
  const openingIn = done.filter((t) => t.kind === "opening").reduce((s, t) => s + t.amount, 0);
  const expenses = done.filter((t) => t.kind === "expense").reduce((s, t) => s + t.amount, 0);
  const fees = done.reduce((s, t) => s + (t.fee ?? 0), 0);
  const openTotal = sumOf(open), closeTotal = sumOf(close);
  const check = openTotal + openingIn + income - expenses - fees;

  // Balances by account, with BCA's pockets under it
  const accountRows = ACCOUNTS.map((a) => {
    const ids = internal.filter((id) => NODES[id].account === a.id);
    const o = ids.reduce((t, id) => t + (open[id] ?? 0), 0), cl = ids.reduce((t, id) => t + (close[id] ?? 0), 0);
    const sub = a.id === "bca" ? POCKETS.map((p) => `<tr class="rp-sub"><td>${esc(p.name)}</td><td class="num">${money(open[p.id])}</td><td class="num">${money(close[p.id] - open[p.id])}</td><td class="num">${money(close[p.id])}</td></tr>`).join("") : "";
    return `<tr><td><b>${esc(a.name)}</b></td><td class="num">${money(o)}</td><td class="num">${money(cl - o)}</td><td class="num"><b>${money(cl)}</b></td></tr>${sub}`;
  }).join("");

  // Spending by category; a period also shows the budget beside it
  const byCat = {};
  done.forEach((t) => {
    if (t.kind === "expense") byCat[t.category] = (byCat[t.category] ?? 0) + t.amount;
    if (t.fee) byCat.fees = (byCat.fees ?? 0) + t.fee;
  });
  let catTable;
  if (r.kind === "period") {
    const version = c.budgetVersionOn(r.startISO);
    const spent = c.spentByLine(c.outflows(ledger, r.period), BUDGET_LINES);
    const lines = BUDGET_LINES.map((l) => ({ name: l.name, cat: l.category, fixed: Boolean(l.fixed), budget: version.amounts[l.id] ?? 0, actual: spent[l.id] }));
    const known = new Set(lines.map((l) => l.cat));
    Object.keys(byCat).filter((k) => !known.has(k)).forEach((k) => lines.push({ name: catLabel(k), cat: k, budget: 0, actual: byCat[k] }));
    const row = (l) => { const a = l.actual ?? 0; return `<tr><td>${esc(l.name)}</td><td class="num">${money(l.budget)}</td><td class="num">${money(a)}</td><td class="num">${money(l.budget - a)}</td></tr>`; };
    // Fixed lines first, then the ones that change month to month, each with its own subtotal
    const rows = LINE_GROUPS.map((g) => {
      const list = lines.filter((l) => Boolean(l.fixed) === (g.id === "fixed"));
      const b = list.reduce((t, l) => t + l.budget, 0), a = list.reduce((t, l) => t + (l.actual ?? 0), 0);
      return `<tr class="rp-group"><td>${g.label} · ${esc(g.sub.toLowerCase())}</td><td class="num">${money(b)}</td><td class="num">${money(a)}</td><td class="num">${money(b - a)}</td></tr>${list.map(row).join("")}`;
    }).join("");
    const tb = lines.reduce((t, l) => t + l.budget, 0), ta = lines.reduce((t, l) => t + (l.actual ?? 0), 0);
    catTable = table(["Category", { t: "Budget", num: 1 }, { t: "Actual", num: 1 }, { t: "Variance", num: 1 }], rows,
      `<tr><td>Total</td><td class="num">${money(tb)}</td><td class="num">${money(ta)}</td><td class="num">${money(tb - ta)}</td></tr>`);
  } else {
    const rows = Object.entries(byCat).map(([k, v]) => `<tr><td>${esc(catLabel(k))}</td><td class="num">${money(v)}</td></tr>`).join("");
    const total = Object.values(byCat).reduce((t, v) => t + v, 0);
    catTable = table(["Category", { t: "Actual", num: 1 }], rows, `<tr><td>Total</td><td class="num">${money(total)}</td></tr>`);
  }

  const journal = done.map((t, i) => `<tr><td class="num">${i + 1}</td><td>${c.fmtShort(t.date)}</td><td>${esc(t.desc)}${t.note ? `<small>${esc(t.note)}</small>` : ""}</td><td>${esc(label(t.to))}</td><td>${esc(label(t.from))}</td><td class="num">${money(t.amount)}</td><td class="num">${money(t.fee)}</td></tr>`).join("");
  const plannedRows = planned.map((t) => `<tr><td>${c.fmtShort(t.date)}</td><td>${esc(t.desc)}</td><td>${esc(label(t.from))} → ${esc(label(t.to))}</td><td class="num">${money(t.amount)}</td></tr>`).join("");

  let daily = "";
  if (r.kind === "day") {
    const limit = c.mealCost(c.dayType(c.toDate(r.startISO)));
    const spent = done.filter((t) => t.kind === "expense" && ["food", "others"].includes(t.category)).reduce((s, t) => s + t.amount, 0);
    daily = `<section><h2>Daily limit</h2>${table(["Item", { t: "Amount", num: 1 }], `<tr><td>Limit (food budget for the day)</td><td class="num">${money(limit)}</td></tr><tr><td>Spent on food and others</td><td class="num">${money(spent)}</td></tr>`,
      `<tr><td>${limit - spent >= 0 ? "Left" : "Over"}</td><td class="num">${money(Math.abs(limit - spent))}</td></tr>`)}</section>`;
  }

  document.title = `${r.kind === "day" ? `Statement ${r.startISO}` : `Statement ${r.startISO} to ${r.endISO}`} - Hub`;
  $("#rp-sheet").innerHTML = `
    <header class="rp-head">
      <div><p class="rp-kicker">Hub · Finance Management</p><h1>${esc(r.title)}</h1></div>
      <dl><div><dt>Currency</dt><dd>IDR (rupiah)</dd></div><div><dt>Monthly salary</dt><dd>${money(c.budgetVersionOn(r.startISO).salary ?? SALARY)}</dd></div><div><dt>Prepared</dt><dd>${c.fmtDate(new Date())}</dd></div></dl>
    </header>
    ${data.live ? "" : `<p class="rp-warn">The database isn't connected, so this report uses the starting data.</p>`}
    <section><h2>Summary</h2>
      ${table(["", { t: "Amount", num: 1 }], `
        <tr><td>Opening balance, all accounts (${c.fmtShort(r.startISO)})</td><td class="num">${money(openTotal)}</td></tr>
        ${openingIn ? `<tr><td>Add: opening balances recorded</td><td class="num">${money(openingIn)}</td></tr>` : ""}
        <tr><td>Add: income</td><td class="num">${money(income)}</td></tr>
        <tr><td>Less: expenses</td><td class="num">${money(-expenses)}</td></tr>
        <tr><td>Less: transfer fees</td><td class="num">${money(-fees)}</td></tr>`,
        `<tr><td>Closing balance, all accounts (${c.fmtShort(r.endISO)})</td><td class="num">${money(closeTotal)}</td></tr>`)}
      <p class="rp-check">${check === closeTotal ? "✓ Balanced: opening + income − expenses − fees equals the closing balance. Transfers between your own accounts don't change the total." : `Check failed by ${money(closeTotal - check)}.`}</p>
    </section>
    <section><h2>Balances by account</h2>${table(["Account", { t: "Opening", num: 1 }, { t: "Change", num: 1 }, { t: "Closing", num: 1 }], accountRows,
      `<tr><td>Total</td><td class="num">${money(openTotal)}</td><td class="num">${money(closeTotal - openTotal)}</td><td class="num">${money(closeTotal)}</td></tr>`)}</section>
    <section><h2>${r.kind === "period" ? "Budget against actual" : "Spending by category"}</h2>${catTable}</section>
    ${daily}
    <section class="rp-journal"><h2>Journal</h2><p class="rp-note">Every completed entry. Debit is where the money went, credit is where it came from.</p>
      ${table([{ t: "#", num: 1 }, "Date", "Description", "Debit", "Credit", { t: "Amount", num: 1 }, { t: "Fee", num: 1 }], journal,
        `<tr><td colspan="5">${done.length} entries</td><td class="num">${money(done.reduce((s, t) => s + t.amount, 0))}</td><td class="num">${money(fees)}</td></tr>`)}</section>
    <section class="rp-planned"><h2>Still planned</h2>${table(["Date", "Description", "From → To", { t: "Amount", num: 1 }], plannedRows,
      planned.length ? `<tr><td colspan="3">Total planned</td><td class="num">${money(planned.reduce((s, t) => s + t.amount, 0))}</td></tr>` : "")}</section>
    <footer class="rp-foot">Amounts in rupiah. Brackets mean a negative amount. Generated by Hub.</footer>`;
}

$("#rp-print").addEventListener("click", () => print());
await load();
render();
// Open the print window right away; that's where the PDF is saved
setTimeout(() => print(), 400);
