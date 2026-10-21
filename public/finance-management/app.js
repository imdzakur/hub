// Finance Management in four tabs: Overview (with the calendar and daily entries), Ledger, Accounts, and Plan.
// Every number is calculated from one list of transactions (data.js), so an entry added on a calendar day
// shows up in every tab. Fixed rules and budgets come from model.js.
import { ICONS } from "/assets/js/map-icons.js";
import {
  ACCOUNTS, BILLS, BUDGET_VERSIONS, CATEGORIES, DAILY_LIMIT_CATEGORIES, FEES, FIRST_PERIOD_START, LINE_GROUPS, MEAL_PLAN,
  NODES, OPEN_QUESTIONS, PARTY_STYLE, POCKETS, RULES, SALARY, TARGETS, WEEKLY_FOOD_MOVE,
} from "./model.js";
import * as c from "./calc.js";
import { data, load, request, sortLedger, toBody } from "./data.js";

const TABS = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "ledger", label: "Ledger", icon: "book" },
  { id: "accounts", label: "Accounts", icon: "bank" },
  { id: "plan", label: "Plan", icon: "pie" },
];

// Whether the top cards hide their amounts. Hidden unless the viewer chose to show them.
function readHide() {
  try { return localStorage.getItem("hub-fm-amounts") !== "shown"; } catch { return true; }
}

const today = new Date();
const todayISO = c.toISO(today);
const midnight = c.toDate(todayISO); // day counts ignore the time of day
const FIRST = c.periodOf(c.toDate(FIRST_PERIOD_START));
const BASE = todayISO < FIRST.startISO ? FIRST : c.periodOf(today);

const state = {
  tab: "overview",
  periodOffset: 0,
  day: null,       // the calendar day open in the day panel
  ledger: { account: "all", category: "all", query: "", scope: "period" },
  budgetVersion: c.budgetVersionOn(BASE.startISO).id,
  flow: null,
  loading: true,   // shows the skeleton until the data is in
  hideAmounts: readHide(), // the top cards show dots instead of amounts
  budgetEdit: false, // Plan's monthly budget is open for editing
  budgetMsg: null,   // { text, error } after saving or resetting the budget
  form: null,      // the entry being added or edited on the open day
  formOpen: false, // the Add entry form is shown
  formMsg: null,   // { text, error }
  busy: false,
};

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const gl = (name, cls = "icon-sm") => `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
const glyph = (name, small, brand) => `<span class="mg-glyph${small ? " is-sm" : ""}"${brand ? ` data-brand="${brand}"` : ""} aria-hidden="true">${gl(name, "")}</span>`;
const nodeLabel = (id) => NODES[id]?.label ?? id;
const cat = (id) => CATEGORIES[id] ?? CATEGORIES.others;
const period = () => c.shiftPeriod(BASE, state.periodOffset);
const sortedLedger = () => sortLedger(data.ledger);
const currentBalances = () => c.balances(data.ledger, { upTo: todayISO, opening: data.opening });
const signedAmount = (t) => (t.kind === "expense" ? c.signed(-t.amount) : t.kind === "income" || t.kind === "opening" ? c.signed(t.amount) : c.rupiah(t.amount));
const isDone = (t) => c.isPosted(t);
const canEnter = (iso) => iso >= FIRST_PERIOD_START && iso <= todayISO; // today and earlier days, back to the first period
const short = (v) => (Math.abs(v) >= 1000 ? `${c.fmtPlain(Math.abs(v) / 1000)}k` : c.fmtPlain(Math.abs(v)));

/* ---------- brands: bank logos and outside parties ---------- */
const account = (id) => ACCOUNTS.find((a) => a.id === id);

function bankLogo(id, full = false) {
  const a = account(id);
  return `<span class="mg-logo${full ? " is-full" : ""}" data-brand="${id}"><img src="/assets/img/banks/${a.logo}${full ? "" : "-mark"}.webp" alt=""></span>`;
}

// The small picture for any node: the bank's logo, or the outside party's glyph in its brand color
function chip(id) {
  const n = NODES[id];
  if (n?.account) return bankLogo(n.account);
  const s = PARTY_STYLE[id] ?? { icon: "box", brand: "ink" };
  if (s.logo) return `<span class="mg-logo" data-brand="${s.brand}"><img src="/assets/img/bills/${s.logo}-mark.webp" alt=""></span>`;
  return glyph(s.icon, true, s.brand);
}

function bankTile(a, balance, extra = "") {
  return `<div class="mg-bank" data-brand="${a.id}">
    <img class="mg-bank-mark" src="/assets/img/banks/${a.logo}-mark.webp" alt="">
    <span class="mg-bank-name">${esc(a.name)}</span>
    <span class="mg-bank-balance">${c.rupiah(balance)}</span>
    <span class="mg-bank-role">${esc(a.role)}</span>${extra}
  </div>`;
}

const party = (id) => `<span class="mg-party">${chip(id)}<span>${esc(nodeLabel(id))}</span></span>`;
const flow = (t) => `<span class="mg-flow">${party(t.from)}${gl("next")}${party(t.to)}</span>`;
const entryChip = (t) => (t.kind === "expense" ? chip(t.to) : t.kind === "income" ? chip(t.from) : glyph(cat(t.category).icon, true, "ink"));

/* ---------- building blocks ---------- */
function card(title, sub, body, cls = "") {
  return `<section class="card ${cls}">${title ? `<header class="mg-card-head"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</header>` : ""}${body}</section>`;
}

// secret: the amount hides behind dots while amounts are hidden. toggle: this card holds the one eye button for all.
function kpi(label, value, sub, { hero = false, icon, secret = false, toggle = false } = {}) {
  const hidden = secret && state.hideAmounts;
  const eye = toggle
    ? `<button type="button" class="mg-eye" data-act="toggle-amounts" aria-pressed="${!state.hideAmounts}" aria-label="${state.hideAmounts ? "Show amounts" : "Hide amounts"}" title="${state.hideAmounts ? "Show amounts" : "Hide amounts"}">${gl(state.hideAmounts ? "eyeoff" : "eye")}</button>`
    : "";
  return `<div class="card mg-kpi${hero ? " is-hero" : ""}${hidden ? " is-masked" : ""}"><span class="mg-kpi-label">${icon ? gl(icon) : ""}${esc(label)}${eye}</span>` +
    `<span class="mg-kpi-value">${hidden ? `<span aria-label="Hidden">Rp ••••••</span>` : value}</span>${sub ? `<span class="mg-kpi-sub">${hidden ? "••••" : sub}</span>` : ""}</div>`;
}

function bars(rows, { max, legend = true } = {}) {
  const top = max ?? Math.max(1, ...rows.map((r) => Math.max(r.plan ?? 0, r.actual ?? 0)));
  const w = (v) => `${Math.max(0, Math.min(100, (v / top) * 100)).toFixed(2)}%`;
  const body = rows.map((r) => {
    const tip = `${r.label}: planned ${c.rupiah(r.plan ?? 0)}${r.actual != null ? `, spent ${c.rupiah(r.actual)}` : ""}`;
    return `<div class="mg-bar"${r.brand ? ` data-brand="${r.brand}"` : ""} title="${esc(tip)}"><span class="mg-bar-label">${r.chip ?? ""}<span>${esc(r.label)}</span></span>` +
      `<span class="mg-bar-track" role="img" aria-label="${esc(tip)}">${r.plan != null ? `<span class="mg-bar-plan" data-w="${w(r.plan)}"></span>` : ""}${r.actual ? `<span class="mg-bar-actual" data-w="${w(r.actual)}"></span>` : ""}</span>` +
      `<span class="mg-bar-value">${c.rupiah(r.actual ?? r.plan ?? 0)}${r.actual != null && r.plan != null ? `<small>of ${c.rupiah(r.plan)}</small>` : ""}</span></div>`;
  }).join("");
  const leg = legend ? `<div class="mg-legend"><span><i class="mg-swatch is-plan"></i>Planned</span><span><i class="mg-swatch is-actual"></i>Spent</span></div>` : "";
  return `<div class="mg-bars">${body}</div>${leg}`;
}

// Bar widths are set through the CSSOM because inline style attributes are blocked by the CSP
function applyWidths(root) {
  root.querySelectorAll("[data-w]").forEach((el) => { el.style.width = el.dataset.w; });
}

function statusBadge(t) {
  if (isDone(t)) return `<span class="badge mg-status is-done">${gl("check")}Done</span>`;
  const late = t.date < todayISO;
  return `<span class="badge mg-status${late ? " is-late" : ""}">${late ? `${gl("alert")}Overdue` : "Planned"}</span>`;
}

function statusButton(t) {
  if (!data.live) return "";
  return isDone(t)
    ? `<button type="button" class="btn btn-plain btn-sm" data-undo="${t.id}">Undo</button>`
    : `<button type="button" class="btn btn-gray btn-sm" data-done="${t.id}">Mark done</button>`;
}

/* ---------- daily limit ---------- */
function dayLimit(iso) {
  const type = c.dayType(c.toDate(iso));
  const limit = c.mealCost(type);
  const spent = data.ledger
    .filter((t) => t.date === iso && t.kind === "expense" && isDone(t) && DAILY_LIMIT_CATEGORIES.includes(t.category))
    .reduce((s, t) => s + t.amount, 0);
  const left = limit - spent;
  const tone = iso > todayISO ? "plan" : Math.abs(left) < 1000 ? "on" : left > 0 ? "ok" : "over";
  return { type, limit, spent, left, tone };
}

function limitText(l) {
  if (l.tone === "plan") return `${short(l.limit)} limit`;
  if (l.tone === "on") return "On the limit";
  if (l.tone === "over") return `${gl("alert", "")}${short(-l.left)} over`;
  return `${short(l.left)} left`;
}

/* ---------- Overview: KPIs, calendar, the open day, spending ---------- */
function viewOverview() {
  const p = period();
  const bal = currentBalances();
  const byAcc = c.accountBalances(bal);
  const total = Object.values(byAcc).reduce((t, a) => t + a.total, 0);
  const ef = bal["bca.ef"];
  const version = c.budgetVersionOn(p.startISO);
  const sum = c.budgetSummary(version);
  const out = c.outflows(data.ledger, p);
  const spent = out.reduce((t, r) => t + r.value, 0);
  const spentByCat = c.sumBy(out, "category");
  const spentByAcc = c.sumBy(out, "account");
  const planByAcc = c.plannedByAccount(version);
  const inside = todayISO >= p.startISO && todayISO <= p.endISO;
  const dayNo = c.daysBetween(p.start, midnight) + 1;
  const target4 = TARGETS[0].months * c.budgetSummary(BUDGET_VERSIONS.at(-1)).spending;
  const periodSub = inside ? `${c.daysBetween(midnight, p.end)} days left · ends ${c.fmtShort(p.end)}` : `${c.fmtShort(p.start)} – ${c.fmtShort(p.end)}`;

  const byLine = c.spentByLine(out, sum.lines);
  const catRows = sum.lines.map((l) => ({ label: l.name, fixed: Boolean(l.fixed), chip: l.payee ? chip(l.payee) : glyph(cat(l.category).icon, true, cat(l.category).brand), plan: l.amount, actual: byLine[l.id] }));
  if (spentByCat.others) catRows.push({ label: "Others", fixed: false, chip: glyph("grid", true), plan: 0, actual: spentByCat.others });
  const top = Math.max(1, ...catRows.map((r) => Math.max(r.plan, r.actual)));
  const groups = LINE_GROUPS.map((g) => {
    const rows = catRows.filter((r) => r.fixed === (g.id === "fixed"));
    const planned = rows.reduce((t, r) => t + r.plan, 0), used = rows.reduce((t, r) => t + r.actual, 0);
    return `<section class="mg-group"><header><h3>${g.label}</h3><span>${c.rupiah(used)} of ${c.rupiah(planned)}</span></header>${bars(rows, { max: top, legend: false })}</section>`;
  }).join("");
  const banks = ACCOUNTS.map((a) => {
    const plan = planByAcc[a.id] ?? 0, used = spentByAcc[a.id] ?? 0;
    const meter = plan || used
      ? `<div class="mg-bank-meter"><span>Spent ${c.rupiah(used)} of ${c.rupiah(plan)}</span><div class="mg-progress-track"><div class="mg-progress-fill" data-w="${Math.min(100, plan ? (used / plan) * 100 : 100).toFixed(1)}%"></div></div></div>`
      : `<div class="mg-bank-meter"><span>No spending planned from here</span></div>`;
    return bankTile(a, byAcc[a.id]?.total ?? 0, meter);
  }).join("");

  return `<div class="mg-kpis">
    ${kpi("Total balance", c.rupiah(total), `${ACCOUNTS.length} banks · ${POCKETS.length} BCA pockets`, { hero: true, icon: "wallet", secret: true, toggle: true })}
    ${kpi("Emergency Fund", c.rupiah(ef), `${c.pct(ef / target4, 0)} of the 4-month target`, { icon: "vault", secret: true })}
    ${kpi("Spent this period", c.rupiah(spent), `of ${c.rupiah(sum.spending)} planned`, { icon: "receipt", secret: true })}
    ${kpi("Saved this period", c.rupiah(sum.saved), `${c.pct(sum.rate)} of salary`, { icon: "trend", secret: true })}
    ${kpi("Period", inside ? `Day ${dayNo} of ${p.days}` : `${p.days} days`, periodSub, { icon: "calendar" })}
  </div>
  ${calendarCard(p)}
  ${dayCard(p)}
  ${card("Spending this period", `${c.fmtShort(p.start)} – ${c.fmtShort(p.end)}`, `<div class="mg-split">${groups}</div>
    <div class="mg-legend"><span><i class="mg-swatch is-plan"></i>Planned</span><span><i class="mg-swatch is-actual"></i>Spent</span></div>`)}
  <div class="mg-banks">${banks}</div>`;
}

function calendarCard(p) {
  const { days } = c.periodDays(p);
  const lead = (days[0].date.getDay() + 6) % 7; // Monday first
  const heads = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => `<div class="mg-cal-head">${d}</div>`).join("");
  const blanks = Array.from({ length: lead }, () => `<div class="mg-cal-day is-blank" aria-hidden="true"></div>`).join("");
  const cells = days.map((d, i) => {
    const payday = d.iso === p.startISO;
    const l = dayLimit(d.iso);
    const entries = sortedLedger().filter((t) => t.date === d.iso);
    const month = d.date.getDate() === 1 || i === 0 ? ` ${c.fmtShort(d.date).split(" ")[1]}` : "";
    const marks = entries.slice(0, 4).map((t) => `<span class="mg-cal-mark${isDone(t) ? "" : " is-planned"}" title="${esc(`${t.desc} · ${c.rupiah(t.amount)}${isDone(t) ? "" : " · planned"}`)}">${entryChip(t)}</span>`).join("") +
      (entries.length > 4 ? `<span class="mg-cal-more">+${entries.length - 4}</span>` : "");
    const cls = [d.type === "weekend" && "is-weekend", d.iso === todayISO && "is-today", payday && "is-payday", d.iso === state.day && "is-selected", d.iso > todayISO && "is-future"].filter(Boolean).join(" ");
    const label = `${c.fmtWeekday(d.date)} ${c.fmtDate(d.date)}${payday ? ", payday" : ""}. Limit ${c.rupiah(l.limit)}${l.tone === "plan" ? "" : `, spent ${c.rupiah(l.spent)}`}. ${entries.length} entries.`;
    return `<button type="button" class="mg-cal-day ${cls}" data-day="${d.iso}" aria-pressed="${d.iso === state.day}" aria-label="${esc(label)}">` +
      `<span class="mg-cal-num"><span>${d.date.getDate()}${month}</span>${payday ? `<span class="mg-star" title="Payday">${gl("star", "")}</span>` : ""}</span>` +
      `<span class="mg-cal-limit" data-tone="${l.tone}">${limitText(l)}</span>` +
      `<span class="mg-cal-marks">${marks}</span></button>`;
  }).join("");
  const key = `<span class="mg-key"><i data-tone="ok"></i>Under</span><span class="mg-key"><i data-tone="on"></i>On</span><span class="mg-key"><i data-tone="over"></i>Over the limit</span>`;
  const note = p.start.getDate() !== 21 ? ` · payday moved to ${c.fmtWeekday(p.start)} ${c.fmtShort(p.start)}` : "";
  return card(`${c.fmtDate(p.start)} – ${c.fmtDate(p.end)}`, `${p.days} days${note}`, `<div class="mg-cal" role="group" aria-label="Days of the period">${heads}${blanks}${cells}</div>
    <div class="mg-cal-foot"><span>Daily limit = the day's food budget; food and others count against it.</span><span class="mg-keys">${key}</span></div>`, "mg-cal-card");
}

function dayCard(p) {
  const iso = state.day;
  const d = c.toDate(iso);
  const l = dayLimit(iso);
  const entries = sortedLedger().filter((t) => t.date === iso);
  // Moves between my own accounts (pocket fills) fold away; spending and income stay in view
  const own = (t) => t.kind === "transfer" && !NODES[t.from]?.external && !NODES[t.to]?.external;
  const main = entries.filter((t) => !own(t));
  const moves = entries.filter(own);
  const row = (t) => {
    const done = isDone(t);
    const late = !done && t.date < todayISO;
    const status = done
      ? `<span class="mg-check" title="Done">${gl("check")}</span>`
      : data.live ? `<button type="button" class="btn btn-gray btn-sm" data-done="${t.id}">${late ? "Overdue · mark done" : "Mark done"}</button>` : `<span class="mg-row-sub">Planned</span>`;
    const tools = data.live ? `<span class="mg-entry-tools">${done ? `<button type="button" class="icon-btn" data-undo="${t.id}" aria-label="Back to planned: ${esc(t.desc)}" title="Back to planned">${gl("undo")}</button>` : ""}<button type="button" class="icon-btn" data-edit="${t.id}" aria-label="Edit ${esc(t.desc)}" title="Edit">${gl("pen")}</button><button type="button" class="icon-btn" data-del="${t.id}" aria-label="Delete ${esc(t.desc)}" title="Delete">${gl("trash")}</button></span>` : "";
    return `<li class="mg-entry${done ? "" : " is-planned"}${state.form?.id === t.id ? " is-editing" : ""}">
      ${entryChip(t)}
      <span class="mg-entry-text"><span class="mg-entry-name">${esc(t.desc)}</span><span class="mg-row-sub">${esc(nodeLabel(t.from))} → ${esc(nodeLabel(t.to))}</span></span>
      <span class="mg-amount">${signedAmount(t)}</span>${status}${tools}
    </li>`;
  };
  const list = main.length ? `<ul class="mg-entries" role="list">${main.map(row).join("")}</ul>` : "";
  const folded = moves.length
    ? `<details class="mg-moves"${moves.some((t) => state.form?.id === t.id) ? " open" : ""}><summary>${moves.length} transfers between your accounts <span>${c.rupiah(moves.reduce((t, x) => t + x.amount, 0))}</span></summary><ul class="mg-entries" role="list">${moves.map(row).join("")}</ul></details>`
    : "";
  const empty = entries.length ? "" : `<p class="mg-row-sub">Nothing on this day.</p>`;
  // One line for the limit: limit, spent, and what's left or over
  const limitLine = l.tone === "plan"
    ? `<span class="mg-limit-line" data-tone="plan">Limit ${c.rupiah(l.limit)}</span>`
    : `<span class="mg-limit-line" data-tone="${l.tone}">${l.tone === "over" ? gl("alert") : ""}Spent ${c.rupiah(l.spent)} of ${c.rupiah(l.limit)} · <b>${l.tone === "over" ? `${c.rupiah(-l.left)} over` : l.tone === "on" ? "on the limit" : `${c.rupiah(l.left)} left`}</b></span>`;
  const editing = Boolean(state.form?.id);
  let form = "";
  if (!canEnter(iso)) {
    form = `<p class="mg-day-note">${gl("info")}${iso > todayISO ? "Entries open on the day itself. Paid a planned bill early? Add it on the day you paid; it's marked done for you." : "This day is before the first period."}</p>`;
  } else if (state.formOpen || editing) {
    form = entryForm(iso);
  }
  const addButton = canEnter(iso) && data.live && !state.formOpen && !editing
    ? `<button type="button" class="btn btn-filled btn-sm" data-act="open-form">${gl("plus")}Add entry</button>` : "";
  const msg = state.formMsg ? `<p class="${state.formMsg.error ? "field-error" : "mg-ok"}" role="${state.formMsg.error ? "alert" : "status"}">${gl(state.formMsg.error ? "alert" : "check")}<span>${esc(state.formMsg.text)}</span></p>` : "";
  return `<section class="card mg-day" id="mg-day" aria-live="polite">
    <header class="mg-day-head"><h2>${c.fmtWeekday(d)}, ${c.fmtDate(d)}${iso === p.startISO ? ` <span class="badge mg-payday">${gl("star")}Payday</span>` : ""}${iso === todayISO ? ` <span class="badge">Today</span>` : ""}</h2><div class="mg-day-tools">${limitLine}${addButton}</div></header>
    ${list}${folded}${empty}${msg}${form}
  </section>`;
}

/* ---------- loading skeletons, shaped like each tab ---------- */
const sk = (cls = "") => `<span class="sk ${cls}"></span>`;
const skCard = (body, cls = "") => `<section class="card mg-sk-card ${cls}">${sk("sk-title")}${body}</section>`;
const skRows = (n) => Array.from({ length: n }, () => `<div class="mg-sk-row">${sk("sk-dot")}${sk("sk-line")}${sk("sk-num")}</div>`).join("");
const skKpis = (n) => `<div class="mg-kpis">${Array.from({ length: n }, () => `<div class="card mg-kpi">${sk("sk-label")}${sk("sk-value")}${sk("sk-label")}</div>`).join("")}</div>`;

function skeleton(tab) {
  if (tab === "overview") {
    return skKpis(5) +
      skCard(`<div class="mg-cal">${Array.from({ length: 35 }, () => `<span class="sk sk-cell"></span>`).join("")}</div>`) +
      skCard(skRows(4)) +
      `<div class="mg-banks">${Array.from({ length: 4 }, () => `<div class="mg-bank">${sk("sk-label")}${sk("sk-value")}${sk("sk-line")}</div>`).join("")}</div>`;
  }
  if (tab === "ledger") return skCard(`<div class="mg-sk-filters">${sk("sk-field")}${sk("sk-field")}${sk("sk-field")}${sk("sk-field")}</div>${skRows(10)}`);
  if (tab === "accounts") {
    return skKpis(3) + `<div class="mg-banks">${Array.from({ length: 4 }, () => `<div class="mg-bank">${sk("sk-label")}${sk("sk-value")}${sk("sk-line")}</div>`).join("")}</div>` +
      skCard(`<div class="mg-pockets">${Array.from({ length: 8 }, () => `<div class="mg-pocket-card">${sk("sk-label")}${sk("sk-value")}${sk("sk-line")}</div>`).join("")}</div>`);
  }
  return skKpis(4) + skCard(skRows(9)) + skCard(skRows(6));
}

/* ---------- the entry form on a day ---------- */
const KIND_LABELS = { expense: "Expense", income: "Income", transfer: "Transfer", opening: "Starting balance" };
const KIND_CATEGORIES = {
  expense: Object.keys(CATEGORIES).filter((k) => CATEGORIES[k].pick),
  income: ["income"],
  transfer: ["transfer", "savings"],
  opening: ["opening"], // what an account or pocket already held when you started
};

const blankForm = (kind = "expense", category = KIND_CATEGORIES[kind][0]) => ({
  id: null, kind, category, desc: "", amount: "", fee: "", feeLabel: "", note: "", from: CATEGORIES[category].from, to: CATEGORIES[category].to,
});

function nodeOptions(selected, side, kind) {
  const all = Object.entries(NODES).filter(([id]) => id !== "opening");
  const own = all.filter(([, n]) => !n.external), ext = all.filter(([, n]) => n.external);
  // A starting balance comes from nowhere into one of my accounts or pockets
  if (kind === "opening") {
    const list = side === "from" ? [["opening", NODES.opening]] : own;
    return list.map(([id, n]) => `<option value="${id}"${id === selected ? " selected" : ""}>${esc(n.label)}</option>`).join("");
  }
  // Expenses go out to someone, income comes in from someone, transfers stay between my own accounts
  const groups = kind === "transfer" ? [["My accounts", own]]
    : (kind === "expense") === (side === "from") ? [["My accounts", own], ["Outside", ext]] : [["Outside", ext], ["My accounts", own]];
  return groups.map(([label, list]) => `<optgroup label="${label}">${list.map(([id, n]) => `<option value="${id}"${id === selected ? " selected" : ""}>${esc(n.label)}</option>`).join("")}</optgroup>`).join("");
}

function entryForm(iso) {
  const f = state.form ??= blankForm();
  const off = !data.live || state.busy;
  const kinds = Object.entries(KIND_LABELS).map(([k, label]) => `<button type="button" class="chip" data-kind="${k}" aria-pressed="${f.kind === k}"${off ? " disabled" : ""}>${label}</button>`).join("");
  const list = KIND_CATEGORIES[f.kind].includes(f.category) ? KIND_CATEGORIES[f.kind] : [...KIND_CATEGORIES[f.kind], f.category];
  const cats = list.map((k) => `<button type="button" class="chip mg-cat-chip" data-cat="${k}" aria-pressed="${k === f.category}"${off ? " disabled" : ""}>${esc(cat(k).label)}</button>`).join("");
  const money = (v) => (v === "" || v == null ? "" : c.fmtPlain(v));
  return `<form class="mg-entry-form" id="mg-entry" novalidate>
    <div class="mg-entry-head"><h3>${f.id ? "Edit entry" : `Add to ${c.fmtShort(iso)}`}</h3><div class="cluster" role="group" aria-label="Type">${kinds}</div></div>
    <div class="mg-cat-picks" role="group" aria-label="Category">${cats}</div>
    <input type="hidden" name="category" value="${esc(f.category)}">
    <fieldset class="mg-form"${off ? " disabled" : ""}>
      <div class="field"><label class="field-label" for="hf-amount">Amount</label><input class="field-input" id="hf-amount" name="amount" inputmode="numeric" required placeholder="0" value="${money(f.amount)}" data-money></div>
      <div class="field is-desc"><label class="field-label" for="hf-desc">Description</label><input class="field-input" id="hf-desc" name="desc" maxlength="120" placeholder="${esc(cat(f.category).label)}" value="${esc(f.desc)}"></div>
      <div class="field"><label class="field-label" for="hf-from">From</label><select class="field-input" id="hf-from" name="from">${nodeOptions(f.from, "from", f.kind)}</select></div>
      <div class="field"><label class="field-label" for="hf-to">To</label><select class="field-input" id="hf-to" name="to">${nodeOptions(f.to, "to", f.kind)}</select></div>
      <details class="mg-more is-wide"${f.fee || f.note ? " open" : ""}><summary>Fee and note</summary>
        <div class="mg-form">
          <div class="field"><label class="field-label" for="hf-fee">Fee</label><input class="field-input" id="hf-fee" name="fee" inputmode="numeric" placeholder="0" value="${money(f.fee || "")}" data-money></div>
          <div class="field"><label class="field-label" for="hf-feeLabel">Fee name</label><input class="field-input" id="hf-feeLabel" name="feeLabel" maxlength="24" placeholder="BI-FAST" value="${esc(f.feeLabel ?? "")}"></div>
          <div class="field is-wide"><label class="field-label" for="hf-note">Note</label><textarea class="field-input" id="hf-note" name="note" rows="2" maxlength="500">${esc(f.note ?? "")}</textarea></div>
        </div>
      </details>
    </fieldset>
    <div class="cluster">
      <button type="submit" class="btn btn-filled btn-sm"${off ? " disabled" : ""}${state.busy ? ' aria-busy="true"' : ""}>${f.id ? "Save changes" : `${gl("plus")}Add`}</button>
      <button type="button" class="btn btn-gray btn-sm" data-act="cancel-edit">Cancel</button>
    </div>
  </form>`;
}

// Reads the form into state.form, keeping numbers as numbers
function readForm(form) {
  const fd = new FormData(form);
  const digits = (v) => { const d = String(v ?? "").replace(/[^\d]/g, ""); return d === "" ? "" : Number(d); };
  return {
    ...state.form,
    category: fd.get("category"), desc: String(fd.get("desc") ?? "").trim(), amount: digits(fd.get("amount")),
    fee: digits(fd.get("fee")), feeLabel: String(fd.get("feeLabel") ?? "").trim(), note: String(fd.get("note") ?? "").trim(),
    from: fd.get("from"), to: fd.get("to"),
  };
}

// A new expense or transfer that matches something planned in this period completes it instead of adding a copy
function plannedMatch(f, iso) {
  if (f.kind === "income") return null;
  const p = c.periodOf(c.toDate(iso));
  const open = data.ledger.filter((t) => !isDone(t) && c.inPeriod(t.date, p) && t.kind === f.kind && t.to === f.to);
  const list = f.kind === "transfer" ? open.filter((t) => t.from === f.from) : open.filter((t) => !["merchants", "others"].includes(t.to));
  const dist = (t) => Math.abs(c.daysBetween(c.toDate(t.date), c.toDate(iso)));
  return list.sort((a, b) => dist(a) - dist(b))[0] ?? null;
}

async function saveEntry(form) {
  const f = readForm(form);
  state.form = f;
  const iso = state.day;
  const problem = !f.amount ? ["amount", "Add an amount above 0."] : f.from === f.to ? ["to", "From and To must be different."] : null;
  if (problem) {
    state.formMsg = { text: problem[1], error: true };
    render();
    $(`#hf-${problem[0]}`)?.focus();
    return;
  }
  const editing = f.id ? data.ledger.find((t) => t.id === f.id) : null;
  const match = editing ? null : plannedMatch(f, iso);
  const entry = {
    date: editing?.date ?? iso, desc: f.desc || match?.desc || cat(f.category).label, from: f.from, to: f.to,
    amount: f.amount, fee: f.fee || 0, feeLabel: f.feeLabel, kind: f.kind, category: f.category,
    status: editing?.status ?? "posted", note: f.note || match?.note,
  };
  state.busy = true;
  state.formMsg = null;
  render();
  try {
    const id = editing?.id ?? match?.id;
    await request(id ? "PATCH" : "POST", id ? `?id=${encodeURIComponent(id)}` : "", toBody(entry));
    await load();
    state.form = blankForm(f.kind, f.category);
    state.formOpen = false;
    state.formMsg = { text: editing ? "Changes saved." : match ? `Matched the planned “${match.desc}”; it's done now.` : "Added." };
  } catch (err) {
    state.formMsg = { text: err.message, error: true };
  } finally {
    state.busy = false;
    render();
  }
}

// Done moves a future planned entry to today, since that's when it happened
async function setDone(id, done) {
  const t = data.ledger.find((x) => x.id === id);
  if (!t) return;
  const date = done && t.date > todayISO ? todayISO : t.date;
  try {
    await request("PATCH", `?id=${encodeURIComponent(id)}`, toBody({ ...t, date, status: done ? "posted" : "scheduled" }));
    await load();
    state.formMsg = { text: done ? `“${t.desc}” is done.` : `“${t.desc}” is planned again.` };
  } catch (err) {
    state.formMsg = { text: err.message, error: true };
  }
  render();
}

let pendingDelete = null;
function askDelete(id) {
  const t = data.ledger.find((x) => x.id === id);
  if (!t) return;
  pendingDelete = id;
  $("#mg-del-desc").textContent = `${t.desc} · ${c.fmtDate(t.date)} · ${c.rupiah(t.amount)}`;
  $("#mg-del").showModal();
}

async function confirmDelete() {
  const id = pendingDelete;
  pendingDelete = null;
  if (!id) return;
  try {
    await request("DELETE", `?id=${encodeURIComponent(id)}`);
    await load();
    if (state.form?.id === id) state.form = blankForm();
    state.formMsg = { text: "Deleted." };
  } catch (err) {
    state.formMsg = { text: err.message, error: true };
  }
  render();
}

/* ---------- Ledger ---------- */
function ledgerNodes(accountId) {
  if (accountId === "all") return null;
  return Object.entries(NODES).filter(([id, n]) => n.account === accountId || id === accountId).map(([id]) => id);
}

function viewLedger() {
  const f = state.ledger;
  const p = period();
  const nodes = ledgerNodes(f.account);
  const all = sortedLedger();
  const running = nodes ? Object.fromEntries(c.runningBalance(all, nodes, data.opening).map((r) => [r.id, r])) : null;
  const q = f.query.trim().toLowerCase();
  const rows = all.filter((t) => {
    if (f.scope === "period" && !c.inPeriod(t.date, p)) return false;
    if (f.scope === "planned" && isDone(t)) return false;
    if (nodes && !nodes.includes(t.from) && !nodes.includes(t.to)) return false;
    if (f.category !== "all" && t.category !== f.category) return false;
    if (q && !`${t.desc} ${nodeLabel(t.from)} ${nodeLabel(t.to)} ${t.note ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const outTotal = rows.filter((t) => t.kind === "expense" && isDone(t)).reduce((s, t) => s + t.amount, 0) + rows.filter(isDone).reduce((s, t) => s + (t.fee ?? 0), 0);
  const inTotal = rows.filter((t) => t.kind === "income" && isDone(t)).reduce((s, t) => s + t.amount, 0);
  const cols = running ? 7 : 6;

  const accountOpts = [`<option value="all">All banks</option>`, ...ACCOUNTS.map((a) => `<option value="${a.id}"${f.account === a.id ? " selected" : ""}>${esc(a.name)}</option>`)].join("");
  const catOpts = [`<option value="all">All categories</option>`, ...Object.entries(CATEGORIES).map(([id, v]) => `<option value="${id}"${f.category === id ? " selected" : ""}>${esc(v.label)}</option>`)].join("");
  const scopes = { period: "This period", planned: "Planned only", all: "All dates" };

  let lastDate = "";
  const body = rows.map((t) => {
    let h = "";
    if (t.date !== lastDate) {
      lastDate = t.date;
      h += `<tr class="mg-day-row"><td colspan="${cols}">${c.fmtWeekday(t.date)}, ${c.fmtDate(t.date)}</td></tr>`;
    }
    const r = running?.[t.id];
    h += `<tr class="${isDone(t) ? "" : "is-muted"}">` +
      `<td><span class="mg-row-title">${esc(t.desc)}</span>${t.note ? `<span class="table-sub">${esc(t.note)}</span>` : ""}</td>` +
      `<td>${flow(t)}</td>` +
      `<td><span class="mg-cat">${glyph(cat(t.category).icon, true, cat(t.category).brand)}${esc(cat(t.category).label)}</span></td>` +
      `<td class="num">${signedAmount(t)}${t.fee ? `<span class="table-sub">fee ${c.rupiah(t.fee)}</span>` : ""}</td>` +
      (running ? `<td class="num">${isDone(t) ? `${c.rupiah(r.balance)}<span class="table-sub">${c.signed(r.delta)}</span>` : "—"}</td>` : "") +
      `<td>${statusBadge(t)}</td><td class="mg-row-actions">${statusButton(t)}</td></tr>`;
    return h;
  }).join("");

  return card(null, null, `<div class="mg-filters">
      <div class="field"><label class="field-label" for="lg-account">Bank</label><select class="field-input mg-select" id="lg-account" data-filter="account">${accountOpts}</select></div>
      <div class="field"><label class="field-label" for="lg-category">Category</label><select class="field-input mg-select" id="lg-category" data-filter="category">${catOpts}</select></div>
      <div class="field"><label class="field-label" for="lg-scope">Show</label><select class="field-input mg-select" id="lg-scope" data-filter="scope">${Object.entries(scopes).map(([k, v]) => `<option value="${k}"${f.scope === k ? " selected" : ""}>${v}</option>`).join("")}</select></div>
      <div class="field"><label class="field-label" for="lg-query">Search</label><search class="search"><svg class="icon icon-sm search-icon" aria-hidden="true"><use href="/assets/icons/sprite.svg#search"></use></svg><input class="field-input search-input" id="lg-query" type="search" placeholder="Description or note" value="${esc(f.query)}" data-filter="query"></search></div>
      <div class="mg-ledger-total">${rows.length} entries<b>${c.signed(inTotal - outTotal)}</b>in ${c.rupiah(inTotal)} · out ${c.rupiah(outTotal)}</div>
    </div>
    <div class="table-wrap"><table class="table table-hover">
      <thead><tr><th>Description</th><th>From → To</th><th>Category</th><th class="num">Amount</th>${running ? `<th class="num">Balance</th>` : ""}<th>Status</th><th></th></tr></thead>
      <tbody>${body || `<tr><td colspan="${cols}" class="mg-row-sub">No entries match these filters.</td></tr>`}</tbody>
    </table></div>`);
}

/* ---------- Accounts ---------- */
function viewAccounts() {
  const bal = currentBalances();
  const byAcc = c.accountBalances(bal);
  const total = Object.values(byAcc).reduce((t, a) => t + a.total, 0);
  const accounts = ACCOUNTS.map((a) => bankTile(a, byAcc[a.id]?.total ?? 0)).join("");
  const pockets = POCKETS.map((p) => {
    const b = bal[p.id];
    const meter = p.fill ? `<div class="mg-progress-track"><div class="mg-progress-fill" data-w="${Math.max(0, Math.min(100, (b / p.fill) * 100)).toFixed(1)}%"></div></div>
      <span class="mg-pocket-note">${c.pct(Math.max(0, b / p.fill), 0)} of ${c.rupiah(p.fill)} left</span>` : "";
    return `<div class="mg-pocket-card" title="${esc(p.rule)}">
      <div class="mg-pocket-head"><span class="mg-pocket-name">${esc(p.name)}</span>${p.temporary ? `<span class="badge">Temporary</span>` : ""}</div>
      <span class="mg-pocket-balance">${c.rupiah(b)}</span>
      <span class="mg-row-sub">${esc(p.purpose)}</span>${meter}
    </div>`;
  }).join("");
  return `<div class="mg-kpis">
    ${kpi("All banks", c.rupiah(total), `${ACCOUNTS.length} banks`, { hero: true, icon: "wallet", secret: true, toggle: true })}
    ${kpi("In BCA pockets", c.rupiah(byAcc.bca?.total ?? 0), `${POCKETS.length} pockets`, { icon: "bank", secret: true })}
    ${kpi("Emergency Fund", c.rupiah(bal["bca.ef"]), "BCA pocket", { icon: "vault", secret: true })}
  </div>
  <div class="mg-banks">${accounts}</div>
  ${card(`${bankLogo("bca")}BCA pockets`, "Hover a pocket to see its rule", `<div class="mg-pockets">${pockets}</div>`, "mg-pockets-card")}`;
}

/* ---------- Plan: budget, bills, payday, savings ---------- */
const FLOW_FIELDS = [
  ["salary", "Salary"], ["rent", "Rent"], ["halo", "Telkomsel Halo"], ["claude", "Claude"], ["pln", "PLN"], ["indihome", "IndiHome"],
  ["parentsHelp", "Parents' help"], ["food", "Food"], ["daily", "Daily Needs"],
];

function projectionChart(start, monthly, first, targets) {
  const pts = c.projectFund(start, monthly, first, 12);
  const all = [{ date: midnight, balance: start }, ...pts];
  const W = 1100, H = 280, L = 44, R = 12, T = 14, B = 24;
  const max = Math.max(...targets.map((t) => t.amount), ...all.map((p) => p.balance)) * 1.05;
  const x = (i) => L + (i / (all.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const line = all.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.balance).toFixed(1)}`).join(" ");
  const area = `${line} L${x(all.length - 1).toFixed(1)} ${y(0)} L${x(0)} ${y(0)} Z`;
  const step = (W - L - R) / (all.length - 1);
  return `<div class="mg-chart" id="mg-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Emergency Fund projection over the next 12 paydays">
    <g class="grid">${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/>`).join("")}</g>
    <g class="axis">${ticks.map((v) => `<text x="${L - 8}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end">${(v / 1e6).toFixed(0)}M</text>`).join("")}
      ${all.map((p, i) => (i % 2 === 0 ? `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${c.fmtShort(p.date)}</text>` : "")).join("")}</g>
    <path class="area" d="${area}"/>
    <g class="target">${targets.map((t) => `<line x1="${L}" x2="${W - R}" y1="${y(t.amount).toFixed(1)}" y2="${y(t.amount).toFixed(1)}"/><text x="${L + 6}" y="${(y(t.amount) - 5).toFixed(1)}">${esc(t.label)} · ${c.fmtPlain(t.amount)}</text>`).join("")}</g>
    <path class="line" d="${line}"/>
    <line class="cross" id="mg-cross" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>
    ${all.map((p, i) => `<circle class="dot" cx="${x(i).toFixed(1)}" cy="${y(p.balance).toFixed(1)}" r="3.5"/>`).join("")}
    ${all.map((p, i) => `<rect class="hit" x="${(x(i) - step / 2).toFixed(1)}" y="${T}" width="${step.toFixed(1)}" height="${H - T - B}" data-x="${(x(i) / W).toFixed(4)}" data-y="${(y(p.balance) / H).toFixed(4)}" data-label="${esc(`${c.fmtDate(p.date)} · ${c.rupiah(p.balance)}`)}"/>`).join("")}
  </svg><div class="mg-tip" id="mg-tip" hidden></div></div>`;
}

function viewPlan() {
  const version = BUDGET_VERSIONS.find((v) => v.id === state.budgetVersion) ?? BUDGET_VERSIONS[0];
  const sum = c.budgetSummary(version);
  const vp = c.periodOf(c.toDate(version.from));
  const meals = c.mealBudget(c.periodDays(vp).counts);
  const chips = BUDGET_VERSIONS.map((v) => `<button type="button" class="chip" data-version="${v.id}" aria-pressed="${v.id === version.id}"${state.budgetEdit ? " disabled" : ""}>${esc(v.label)}${v.custom ? " · edited" : ""}</button>`).join("");
  const editing = state.budgetEdit;
  const moneyInput = (key, value, label) => `<input class="field-input mg-bud-input" data-bud="${key}" inputmode="numeric" data-money aria-label="${esc(label)}" value="${c.fmtPlain(value)}">`;
  const lineRow = (l) => `<tr><td><span class="mg-cat">${l.payee ? chip(l.payee) : glyph(cat(l.category).icon, true, cat(l.category).brand)}${esc(l.name)}</span>${l.note ? `<span class="table-sub">${esc(l.note)}</span>` : ""}</td><td>${party(l.keptIn)}</td><td class="num">${editing ? moneyInput(l.id, l.amount, l.name) : c.rupiah(l.amount)}</td><td class="num">${c.pct(l.amount / sum.salary)}</td></tr>`;
  // While editing, salary and parents' help can change too
  const incomeRows = editing
    ? `<tr class="mg-group-row"><td colspan="4">Income</td></tr>
      <tr><td>Salary</td><td>${party("bsi")}</td><td class="num">${moneyInput("salary", sum.salary, "Salary")}</td><td></td></tr>
      <tr><td>Parents' help<span class="table-sub">Added to PLN</span></td><td>${party("bca.ef")}</td><td class="num">${moneyInput("parentsHelp", version.parentsHelp, "Parents' help")}</td><td></td></tr>` : "";
  // Edit, save, cancel, reset
  const startOptions = Array.from({ length: 6 }, (_, k) => c.shiftPeriod(BASE, k)).map((pp, k) =>
    `<option value="${pp.startISO}"${pp.startISO === (version.from > BASE.startISO ? c.periodOf(c.toDate(version.from)).startISO : BASE.startISO) ? " selected" : ""}>${c.fmtDate(pp.start)}${k === 0 ? " (this period)" : ""}</option>`).join("");
  const anyCustom = BUDGET_VERSIONS.some((v) => v.custom);
  const budMsg = state.budgetMsg ? `<p class="${state.budgetMsg.error ? "field-error" : "mg-ok"}" role="${state.budgetMsg.error ? "alert" : "status"}">${gl(state.budgetMsg.error ? "alert" : "check")}<span>${esc(state.budgetMsg.text)}</span></p>` : "";
  const budTools = !data.live ? "" : !data.budgetsReady
    ? `<p class="mg-day-note">${gl("info")}To change these amounts, run supabase/sql_update.sql in Supabase once.</p>`
    : editing
      ? `<div class="mg-bud-tools"><label class="mg-bud-from">Starts from <select class="field-input" id="bud-from">${startOptions}</select></label>
          <span class="mg-row-sub">Earlier periods keep their amounts; later ones get the same change.</span>
          <span class="cluster"><button type="button" class="btn btn-gray btn-sm" data-act="cancel-budget">Cancel</button><button type="button" class="btn btn-filled btn-sm" data-act="save-budget"${state.busy ? ' aria-busy="true"' : ""}>Save amounts</button></span></div>`
      : `<div class="mg-bud-tools"><button type="button" class="btn btn-gray btn-sm" data-act="edit-budget">${gl("pen")}Edit amounts</button>${anyCustom ? `<button type="button" class="btn btn-plain btn-sm" data-act="reset-budget">${gl("undo")}Reset to default</button>` : ""}</div>`;
  const lines = LINE_GROUPS.map((g) => {
    const list = sum.lines.filter((l) => Boolean(l.fixed) === (g.id === "fixed"));
    const total = list.reduce((t, l) => t + l.amount, 0);
    return `<tr class="mg-group-row"><td colspan="2">${g.label} <span>${g.sub}</span></td><td class="num">${c.rupiah(total)}</td><td class="num">${c.pct(total / sum.salary)}</td></tr>${list.map(lineRow).join("")}`;
  }).join("");
  const billAmount = (b) => (b.id === "pln" ? version.amounts.pln + version.parentsHelp : version.amounts[b.id] ?? b.amount);
  const bills = BILLS.map((b) => `<tr><td>${party(b.to)}</td><td>${party(b.from)}${b.via ? `<span class="table-sub">via ${esc(b.via)}</span>` : ""}</td><td>${esc(b.window)}</td><td class="num">${c.rupiah(billAmount(b))}</td></tr>`).join("");
  const mealRows = meals.rows.map((r) => `<tr><td>${esc(r.label)}</td><td class="num">${r.budgetDays}</td><td class="num">${r.actualDays}</td><td class="num">${r.lunch ? c.rupiah(r.lunch) : "—"}</td><td class="num">${c.rupiah(r.dinner)}</td><td class="num">${c.rupiah(r.perDay)}</td><td class="num">${c.rupiah(r.budget)}</td></tr>`).join("");
  const diff = meals.actual - meals.budget;

  // Payday simulation
  const next = c.nextPayday(today);
  const defaults = c.flowInputs(c.budgetVersionOn(c.toISO(next)));
  state.flow ??= { ...defaults };
  const pf = c.paydayFlow(state.flow);
  const changed = FLOW_FIELDS.some(([k]) => state.flow[k] !== defaults[k]);
  const fields = FLOW_FIELDS.map(([k, label]) => `<div class="field"><label class="field-label" for="pf-${k}">${esc(label)}</label><input class="field-input" id="pf-${k}" inputmode="numeric" data-flow="${k}" value="${c.fmtPlain(state.flow[k])}"></div>`).join("");
  const steps = pf.steps.map((s, i) => `<li class="mg-step"><span class="mg-step-num">${i + 1}</span><span class="mg-row-text"><span class="mg-step-flow">${party(s.from)}${gl("next")}${party(s.to)}</span><span class="mg-row-sub">${esc(s.note ?? (s.fee ? `${s.feeLabel} fee ${c.rupiah(s.fee)}` : "Free"))}</span></span><span class="mg-amount">${c.rupiah(s.amount)}</span></li>`).join("");

  // Savings
  const ef = currentBalances()["bca.ef"];
  const latest = c.budgetSummary(BUDGET_VERSIONS.at(-1));
  const targets = TARGETS.map((t) => ({ ...t, amount: t.months * latest.spending, label: `${t.months} months` }));
  const progress = targets.map((t) => {
    const e = c.eta(t.amount, ef, latest.saved, next);
    return `<div class="mg-progress"><div class="mg-progress-meta"><span><b>${esc(t.name)}</b> · ${esc(t.note)}</span><span>${c.rupiah(ef)} of ${c.rupiah(t.amount)}</span></div>
      <div class="mg-progress-track"><div class="mg-progress-fill" data-w="${Math.min(100, (ef / t.amount) * 100).toFixed(1)}%"></div></div>
      <div class="mg-progress-meta"><span>${c.pct(Math.min(1, ef / t.amount), 0)}</span><span>${e.reached ? "Reached" : `Reached at payday ${c.fmtDate(e.date)} · ${e.months} paydays`}</span></div></div>`;
  }).join("");

  return `<h2 class="mg-section">Budget</h2>
  <div class="cluster">${chips}</div>
  <div class="mg-kpis">
    ${kpi("Salary", c.rupiah(sum.salary), "On the 21st, or the next workday", { icon: "arrowin" })}
    ${kpi("Planned spending", c.rupiah(sum.spending), `${c.pct(sum.spending / sum.salary)} of salary`, { icon: "receipt" })}
    ${kpi("To the Emergency Fund", c.rupiah(sum.saved), `${c.pct(sum.rate)} saved`, { hero: true, icon: "vault" })}
    ${kpi("Fees", c.rupiah(version.amounts.fees), `BI-FAST ${c.fmtPlain(FEES.biFast)} + BCA ${c.fmtPlain(FEES.bcaMonthlyAdmin)}`, { icon: "percent" })}
    ${version.parentsHelp ? kpi("Parents' help", c.rupiah(version.parentsHelp), "Utilities only", { icon: "users" }) : ""}
  </div>
  ${card("Monthly budget", `${esc(version.label)}${version.custom ? " · edited by you" : ""}`, `${budTools}${budMsg}<div class="table-wrap"><table class="table${editing ? " is-editing" : ""}"><thead><tr><th>Line</th><th>Kept in</th><th class="num">Amount</th><th class="num">Share</th></tr></thead><tbody>${incomeRows}${lines}</tbody>
      <tfoot><tr><td colspan="2">Total spending</td><td class="num">${c.rupiah(sum.spending)}</td><td class="num">${c.pct(sum.spending / sum.salary)}</td></tr><tr><td colspan="2">Left for the Emergency Fund</td><td class="num">${c.rupiah(sum.saved)}</td><td class="num">${c.pct(sum.rate)}</td></tr></tfoot></table></div>`)}
  ${card("Bills", "Pay any day in the window; the last day is the deadline", `<div class="table-wrap"><table class="table"><thead><tr><th>Bill</th><th>Paid from</th><th>When</th><th class="num">Amount</th></tr></thead><tbody>${bills}</tbody></table></div>`)}
  ${card("Food plan", `Budget uses ${Object.values(MEAL_PLAN).reduce((t, m) => t + m.budgetDays, 0)} days; ${c.fmtShort(vp.start)} – ${c.fmtShort(vp.end)} has ${vp.days}`, `<div class="table-wrap"><table class="table"><thead><tr><th>Day type</th><th class="num">Budget days</th><th class="num">This period</th><th class="num">Lunch</th><th class="num">Dinner</th><th class="num">Per day</th><th class="num">Month</th></tr></thead><tbody>${mealRows}</tbody>
    <tfoot><tr><td colspan="6">Food budget</td><td class="num">${c.rupiah(meals.budget)}</td></tr><tr><td colspan="6">At this period's real day count</td><td class="num">${c.rupiah(meals.actual)} <span class="table-sub">${diff ? `${c.signed(-diff)} vs budget, covered from Bonus or Daily Needs` : "Matches the budget"}</span></td></tr></tfoot></table></div>
    <p class="mg-row-sub">Weekly move Food → Main: about ${c.rupiah(WEEKLY_FOOD_MOVE)}. What's left of each day's food goes to Bonus that night.</p>`)}

  <h2 class="mg-section">Payday · ${c.fmtWeekday(next)}, ${c.fmtDate(next)}</h2>
  ${card("Simulate", changed ? "Changed from the budget. Not saved." : "Edit any number to see the effect", `<div class="mg-form">${fields}</div>
      <div class="cluster"><button type="button" class="btn btn-gray btn-sm" data-act="reset-flow"${changed ? "" : " disabled"}>Reset to budget</button>${pf.valid ? "" : `<span class="mg-warn">Not enough left for these amounts.</span>`}<span class="mg-row-sub">To the Emergency Fund: <b>${c.rupiah(pf.toEF)}</b> · saved ${c.rupiah(pf.saved)} (${c.pct(pf.rate)})</span></div>`)}
  ${card("Transfers on payday", `${pf.steps.length} steps`, `<ol class="mg-steps" role="list">${steps}</ol>`)}

  <h2 class="mg-section">Savings</h2>
  ${card("Emergency Fund targets", `${c.rupiah(ef)} now · ${(ef / latest.spending).toFixed(1)} months covered`, `<div class="stack">${progress}</div>`)}
  ${card("Projection", "Emergency Fund after each payday, before Bonus and Daily Needs leftovers", `${projectionChart(ef, latest.saved, next, targets)}
    <div class="mg-legend"><span><i class="mg-swatch is-actual"></i>Emergency Fund</span><span><i class="mg-swatch is-target"></i>Targets</span></div>`)}
  ${card("Rules", null, `<ol class="mg-notes is-columns">${RULES.map((r) => `<li>${esc(r)}</li>`).join("")}</ol>`)}
  ${card("Not decided yet", null, `<ol class="mg-notes">${OPEN_QUESTIONS.map((q) => `<li>${esc(q)}</li>`).join("")}</ol>`)}`;
}

/* ---------- saving and resetting the budget ---------- */
// The new amounts start on the chosen period and carry into every later version, so a raised IndiHome
// stays raised. Only what you changed is carried; the rest of each later version stays as it was.
async function saveBudget() {
  const version = BUDGET_VERSIONS.find((v) => v.id === state.budgetVersion) ?? BUDGET_VERSIONS[0];
  const read = (k) => Number(String($(`[data-bud="${k}"]`)?.value ?? "").replace(/[^\d]/g, "")) || 0;
  const amounts = {};
  Object.keys(version.amounts).forEach((k) => { if (read(k) !== version.amounts[k]) amounts[k] = read(k); });
  const salary = read("salary"), parentsHelp = read("parentsHelp");
  const salaryChanged = salary !== (version.salary ?? SALARY), helpChanged = parentsHelp !== version.parentsHelp;
  if (!Object.keys(amounts).length && !salaryChanged && !helpChanged) {
    state.budgetMsg = { text: "Nothing changed." };
    state.budgetEdit = false;
    render();
    return;
  }
  const from = $("#bud-from").value;
  const apply = (v, start) => ({
    from: start,
    salary: salaryChanged ? salary : v.salary ?? SALARY,
    parentsHelp: helpChanged ? parentsHelp : v.parentsHelp,
    amounts: { ...v.amounts, ...amounts },
  });
  const rows = [apply(c.budgetVersionOn(from), from), ...BUDGET_VERSIONS.filter((v) => v.from > from).map((v) => apply(v, v.from))];
  state.busy = true;
  render();
  try {
    await request("POST", "?type=budget", rows);
    await load();
    state.budgetVersion = c.budgetVersionOn(from).id;
    state.budgetEdit = false;
    state.flow = null;
    state.budgetMsg = { text: `Saved. The new amounts start ${c.fmtDate(from)}.` };
  } catch (err) {
    state.budgetMsg = { text: err.message, error: true };
  } finally {
    state.busy = false;
    render();
  }
}

async function resetBudget() {
  try {
    await request("DELETE", "?type=budget");
    await load();
    state.budgetVersion = c.budgetVersionOn(BASE.startISO).id;
    state.flow = null;
    state.budgetMsg = { text: "Back to the default amounts." };
  } catch (err) {
    state.budgetMsg = { text: err.message, error: true };
  }
  render();
}

/* ---------- shell ---------- */
const stampFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short", year: "numeric" });

// Reload from the database; the skeleton shows for at least a moment so the refresh is visible
async function refresh() {
  if (state.loading && data.loadedAt) return;
  state.loading = true;
  render();
  await Promise.all([load(), new Promise((r) => setTimeout(r, 450))]);
  state.loading = false;
  render();
}

const VIEWS = { overview: viewOverview, ledger: viewLedger, accounts: viewAccounts, plan: viewPlan };

// The open day stays inside the shown period: today when it's in there, otherwise the period's payday
function keepDay() {
  const p = period();
  if (state.day && c.inPeriod(state.day, p)) return;
  state.day = c.inPeriod(todayISO, p) ? todayISO : p.startISO;
  state.form = null;
  state.formMsg = null;
}

function render() {
  keepDay();
  const p = period();
  $("#mg-period-label").textContent = `${c.fmtShort(p.start)} – ${c.fmtDate(p.end)}`;
  $("#mg-sub").textContent = `${state.periodOffset === 0 ? "Current period" : state.periodOffset < 0 ? "Past period" : "Future period"} · salary ${c.rupiah(c.budgetVersionOn(p.startISO).salary ?? SALARY)}`;
  $("#mg-prev").disabled = p.startISO <= FIRST.startISO;
  document.querySelectorAll("#mg-tabs .tab").forEach((t) => {
    const on = t.dataset.tab === state.tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
  });
  const banner = $("#mg-banner");
  banner.hidden = !data.error;
  banner.querySelector("span").textContent = data.live
    ? `Couldn't refresh: ${data.error}`
    : "Database not connected, so nothing can be shown or saved. Check Supabase, then press Refresh.";
  const updated = $("#mg-updated");
  updated.textContent = state.loading ? "Updating…" : data.loadedAt ? `Updated ${stampFmt.format(data.loadedAt)}` : "Not connected";
  $("#mg-refresh").toggleAttribute("aria-busy", state.loading);
  const view = $("#mg-view");
  view.setAttribute("aria-busy", String(state.loading));
  if (state.loading) { view.innerHTML = skeleton(state.tab); return; }
  view.innerHTML = VIEWS[state.tab]();
  applyWidths(view);
  if (state.tab === "plan") bindChart();
}

function bindChart() {
  const chart = $("#mg-chart");
  if (!chart) return;
  const tip = $("#mg-tip"), cross = $("#mg-cross");
  const svg = chart.querySelector("svg");
  const show = (hit) => {
    tip.textContent = hit.dataset.label;
    tip.hidden = false;
    tip.style.left = `${Number(hit.dataset.x) * 100}%`;
    tip.style.top = `${Number(hit.dataset.y) * 100}%`;
    const cx = Number(hit.dataset.x) * svg.viewBox.baseVal.width;
    cross.setAttribute("x1", cx); cross.setAttribute("x2", cx); cross.setAttribute("visibility", "visible");
  };
  chart.addEventListener("pointerover", (e) => { const h = e.target.closest(".hit"); if (h) show(h); });
  chart.addEventListener("pointerleave", () => { tip.hidden = true; cross.setAttribute("visibility", "hidden"); });
}

function buildSprite() {
  $("#fm-sprite").innerHTML = "<defs>" + Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join("") + "</defs>";
}

function buildTabs() {
  const nav = $("#mg-tabs");
  nav.innerHTML = TABS.map((t) => `<button type="button" class="tab" role="tab" data-tab="${t.id}" aria-controls="mg-view" aria-selected="false" tabindex="-1">${gl(t.icon)}<span>${t.label}</span></button>`).join("");
  nav.addEventListener("click", (e) => { const b = e.target.closest(".tab"); if (b) go(b.dataset.tab); });
  nav.addEventListener("keydown", (e) => {
    const ids = TABS.map((t) => t.id);
    const i = ids.indexOf(state.tab);
    const j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ids.length - 1 }[e.key];
    if (j === undefined) return;
    e.preventDefault();
    go(ids[(j + ids.length) % ids.length]);
    nav.querySelector(`[data-tab="${state.tab}"]`).focus();
  });
}

function go(tab) {
  state.tab = TABS.some((t) => t.id === tab) ? tab : "overview";
  history.replaceState(null, "", `#${state.tab}`);
  render();
}

function openDay(iso) {
  if (state.day !== iso) { state.form = null; state.formOpen = false; state.formMsg = null; }
  state.day = iso;
  render();
  // On narrow screens the day panel sits under the calendar
  if (matchMedia("(width < 64rem)").matches) $("#mg-day")?.scrollIntoView({ block: "start", behavior: "smooth" });
}

function bind() {
  const view = $("#mg-view");
  view.addEventListener("change", (e) => {
    const f = e.target.dataset.filter;
    if (f && f !== "query") { state.ledger[f] = e.target.value; render(); return; }
    // Payday simulation: numbers are typed with thousands separators
    const k = e.target.dataset.flow;
    if (k) {
      state.flow[k] = Number(e.target.value.replace(/[^\d]/g, "")) || 0;
      render();
      $(`#pf-${k}`)?.focus();
      return;
    }
  });
  view.addEventListener("input", (e) => {
    // Keep what's typed, so a re-render doesn't lose it
    if (e.target.form?.id === "mg-entry") { state.form = readForm(e.target.form); return; }
    if (e.target.dataset.filter === "query") {
      state.ledger.query = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const input = $("#lg-query");
      input.focus();
      input.setSelectionRange(pos, pos);
    }
  });
  // Amounts get thousands separators when the field is left
  view.addEventListener("focusout", (e) => {
    if (!e.target.matches?.("[data-money]")) return;
    const v = e.target.value.replace(/[^\d]/g, "");
    e.target.value = v ? c.fmtPlain(Number(v)) : "";
  });
  view.addEventListener("submit", (e) => {
    if (e.target.id !== "mg-entry") return;
    e.preventDefault();
    saveEntry(e.target);
  });
  view.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.day) { openDay(b.dataset.day); return; }
    if (b.dataset.cat) {
      const category = b.dataset.cat;
      state.form = { ...readForm(b.closest("form")), category, from: CATEGORIES[category]?.from ?? state.form.from, to: CATEGORIES[category]?.to ?? state.form.to };
      render();
      $(`[data-cat="${category}"]`)?.focus();
      return;
    }
    if (b.dataset.kind) {
      const kind = b.dataset.kind;
      state.form = { ...blankForm(kind), amount: state.form?.amount ?? "", desc: state.form?.desc ?? "" };
      render();
      return;
    }
    if (b.dataset.version) { state.budgetVersion = b.dataset.version; render(); }
    if (b.dataset.act === "reset-flow") { state.flow = null; render(); }
    if (b.dataset.act === "edit-budget") { state.budgetEdit = true; state.budgetMsg = null; render(); $(".mg-bud-input")?.focus(); }
    if (b.dataset.act === "cancel-budget") { state.budgetEdit = false; state.budgetMsg = null; render(); }
    if (b.dataset.act === "save-budget") saveBudget();
    if (b.dataset.act === "reset-budget") $("#mg-reset").showModal();
    if (b.dataset.act === "toggle-amounts") {
      state.hideAmounts = !state.hideAmounts;
      try { localStorage.setItem("hub-fm-amounts", state.hideAmounts ? "hidden" : "shown"); } catch { /* private mode */ }
      render();
      $('[data-act="toggle-amounts"]')?.focus();
    }
    if (b.dataset.act === "cancel-edit") { state.form = blankForm(); state.formOpen = false; state.formMsg = null; render(); }
    if (b.dataset.act === "open-form") { state.formOpen = true; state.formMsg = null; render(); $("#mg-entry")?.scrollIntoView({ block: "nearest", behavior: "smooth" }); $("#hf-amount")?.focus({ preventScroll: true }); }
    if (b.dataset.done) setDone(b.dataset.done, true);
    if (b.dataset.undo) setDone(b.dataset.undo, false);
    if (b.dataset.edit) {
      const t = data.ledger.find((x) => x.id === b.dataset.edit);
      if (!t) return;
      state.form = { id: t.id, kind: t.kind, category: t.category, desc: t.desc, amount: t.amount, fee: t.fee || "", feeLabel: t.feeLabel ?? "", from: t.from, to: t.to, note: t.note ?? "" };
      state.formMsg = null;
      render();
      $("#mg-entry")?.scrollIntoView({ block: "nearest" });
      $("#hf-amount")?.focus();
    }
    if (b.dataset.del) askDelete(b.dataset.del);
  });
  $("#mg-reset").addEventListener("close", () => { if ($("#mg-reset").returnValue === "reset") resetBudget(); });
  $("#mg-del").addEventListener("close", () => {
    if ($("#mg-del").returnValue === "delete") confirmDelete(); else pendingDelete = null;
  });
  $("#mg-prev").addEventListener("click", () => { if (period().startISO > FIRST.startISO) { state.periodOffset--; render(); } });
  $("#mg-next").addEventListener("click", () => { state.periodOffset++; render(); });
  $("#mg-now").addEventListener("click", () => { state.periodOffset = 0; state.day = null; render(); });

  // Report: one day, or the whole period on screen
  const dlg = $("#mg-report");
  $("#mg-report-open").addEventListener("click", () => {
    const p = period();
    $("#rp-day").value = state.day;
    $("#rp-day").min = FIRST_PERIOD_START;
    $("#rp-day").max = p.endISO > todayISO ? p.endISO : todayISO;
    $("#rp-period-label").textContent = `${c.fmtDate(p.start)} – ${c.fmtDate(p.end)}`;
    dlg.showModal();
  });
  dlg.addEventListener("close", () => {
    if (dlg.returnValue !== "open") return;
    const kind = dlg.querySelector('input[name="rp-kind"]:checked').value;
    const q = kind === "day" ? `day=${$("#rp-day").value}` : `period=${period().startISO}`;
    window.open(`/finance-management/report.html?${q}`, "_blank", "noopener");
  });
  $("#mg-refresh").addEventListener("click", refresh);
  $("#mg-add-today").addEventListener("click", () => {
    state.periodOffset = 0;
    state.day = c.inPeriod(todayISO, BASE) ? todayISO : null;
    state.form = null;
    state.formOpen = true;
    state.formMsg = null;
    go("overview");
    $("#mg-entry")?.scrollIntoView({ block: "center", behavior: "smooth" });
    $("#hf-amount")?.focus({ preventScroll: true });
  });
  addEventListener("hashchange", () => go(location.hash.slice(1)));
}

buildSprite();
buildTabs();
bind();
go(location.hash.slice(1) || "overview");
refresh();
