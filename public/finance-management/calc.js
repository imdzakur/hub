// Calculations for Finance Management. Pure functions over model.js; no DOM here.
import {
  BUDGET_LINES, BUDGET_VERSIONS, FEES, HOLIDAYS, MAIN_RESERVE, MEAL_PLAN, NODES, PAYDAY, SALARY,
} from "./model.js";

/* ---------- dates ---------- */
export const toDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
export const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
export const daysBetween = (a, b) => Math.round((b - a) / 86400000);

/* ---------- paydays and periods ---------- */
// Salary comes on the 21st. On a weekend or public holiday it comes on the next workday.
export const isDayOff = (d) => d.getDay() === 0 || d.getDay() === 6 || HOLIDAYS.includes(toISO(d));

export function paydayIn(year, month) {
  let d = new Date(year, month, PAYDAY);
  while (isDayOff(d)) d = addDays(d, 1);
  return d;
}

// A period runs from one payday to the day before the next, so a late payday makes the period longer
function periodFrom(year, month) {
  const start = paydayIn(year, month);
  const end = addDays(paydayIn(year, month + 1), -1);
  return { start, end, startISO: toISO(start), endISO: toISO(end), days: daysBetween(start, end) + 1, year: start.getFullYear(), month: start.getMonth() };
}

export function periodOf(date) {
  const here = periodFrom(date.getFullYear(), date.getMonth());
  return date < here.start ? periodFrom(date.getFullYear(), date.getMonth() - 1) : here;
}

export const shiftPeriod = (period, n) => periodFrom(period.year, period.month + n);
export const inPeriod = (iso, period) => iso >= period.startISO && iso <= period.endISO;

/* ---------- budget ---------- */
export function budgetVersionOn(iso) {
  return [...BUDGET_VERSIONS].reverse().find((v) => v.from <= iso) ?? BUDGET_VERSIONS[0];
}

export function budgetSummary(version, salary = version.salary ?? SALARY) {
  const lines = BUDGET_LINES.map((l) => ({ ...l, amount: version.amounts[l.id] ?? 0 }));
  const spending = lines.reduce((t, l) => t + l.amount, 0);
  const saved = salary - spending;
  return { lines, spending, salary, saved, rate: salary ? saved / salary : 0, parentsHelp: version.parentsHelp };
}

/* ---------- payday flow (section 6) ---------- */
// inputs: salary, rent, halo, claude, pln and indihome (full bills), food, daily, parentsHelp.
// The Emergency Fund gets everything left in Main; savings = that deposit minus the utilities you pay yourself.
export function paydayFlow(inputs) {
  const i = { ...inputs };
  const toSea = i.salary - FEES.biFast;
  const toMain = toSea - i.rent - i.halo;
  const toEF = toMain - i.food - i.claude - i.daily - MAIN_RESERVE;
  const ownUtilities = i.pln + i.indihome - i.parentsHelp;
  const saved = toEF - ownUtilities;
  const spending = i.salary - saved;
  const steps = [
    { from: "employer", to: "bsi", amount: i.salary },
    { from: "bsi", to: "seabank", amount: toSea, fee: FEES.biFast, feeLabel: "BI-FAST" },
    { from: "seabank", to: "bca.main", amount: toMain },
    { from: "bca.main", to: "bca.ef", amount: toEF, note: `Savings ${fmtPlain(saved)} + utilities ${fmtPlain(ownUtilities)}` },
    { from: "bca.main", to: "bca.food", amount: i.food },
    { from: "bca.main", to: "bca.claude", amount: i.claude },
    { from: "bca.main", to: "bca.daily", amount: i.daily },
    { from: "seabank", to: "landlord", amount: i.rent, note: "On the rent bill date" },
    { from: "seabank", to: "telkomsel", amount: i.halo, note: "Kept for next month's Halo" },
  ];
  if (i.parentsHelp) steps.push({ from: "parents", to: "bca.ef", amount: i.parentsHelp, note: "Help with utilities" });
  return { steps, toSea, toMain, toEF, saved, spending, rate: i.salary ? saved / i.salary : 0, valid: toMain >= 0 && toEF >= 0 };
}

// The PLN line holds only what you pay; parents' help tops it up to the full bill
export function flowInputs(version, salary = version.salary ?? SALARY) {
  const a = version.amounts;
  return { salary, rent: a.rent, halo: a.halo, claude: a.claude, pln: a.pln + version.parentsHelp, indihome: a.indihome, food: a.food, daily: a.daily, parentsHelp: version.parentsHelp };
}

/* ---------- calendar and food (section 5) ---------- */
export function dayType(date) {
  const wd = date.getDay();
  if (MEAL_PLAN.weekend.weekdays.includes(wd)) return "weekend";
  if (MEAL_PLAN.fasting.weekdays.includes(wd) && toISO(date) >= MEAL_PLAN.fasting.startsOn) return "fasting";
  return "regular";
}

export const mealCost = (type) => MEAL_PLAN[type].lunch + MEAL_PLAN[type].dinner;

export function periodDays(period) {
  const days = [];
  for (let d = period.start; d <= period.end; d = addDays(d, 1)) days.push({ date: d, iso: toISO(d), type: dayType(d) });
  const counts = { regular: 0, fasting: 0, weekend: 0 };
  days.forEach((d) => { counts[d.type]++; });
  return { days, counts };
}

/* ---------- ledger ---------- */
export const isPosted = (t) => (t.status ?? "posted") === "posted";

// opening: balances carried over from entries the database already removed (older than 6 months)
export function balances(ledger, { upTo = null, includeScheduled = false, opening = {} } = {}) {
  const bal = Object.fromEntries(Object.keys(NODES).map((k) => [k, opening[k] ?? 0]));
  ledger.forEach((t) => {
    if (!includeScheduled && !isPosted(t)) return;
    if (upTo && t.date > upTo) return;
    bal[t.from] = (bal[t.from] ?? 0) - t.amount - (t.fee ?? 0);
    bal[t.to] = (bal[t.to] ?? 0) + t.amount;
  });
  return bal;
}

// Internal balances only: accounts and pockets, grouped by account
export function accountBalances(bal) {
  const byAccount = {};
  Object.entries(NODES).forEach(([id, n]) => {
    if (n.external) return;
    (byAccount[n.account] ??= { total: 0, nodes: [] });
    byAccount[n.account].total += bal[id];
    byAccount[n.account].nodes.push({ id, ...n, balance: bal[id] });
  });
  return byAccount;
}

// Money that left the household: expenses to outside parties plus transfer fees
export function outflows(ledger, period, { includeScheduled = false } = {}) {
  const rows = [];
  ledger.forEach((t) => {
    if (!inPeriod(t.date, period)) return;
    if (!includeScheduled && !isPosted(t)) return;
    const account = NODES[t.from]?.account ?? t.from;
    if (t.kind === "expense") rows.push({ ...t, value: t.amount, account });
    if (t.fee) rows.push({ ...t, value: t.fee, category: "fees", account, desc: `${t.feeLabel ?? "Fee"}: ${t.desc}` });
  });
  return rows;
}

// Spent against each budget line: by payee when the line has one (PLN, IndiHome, rent), otherwise by category
export function spentByLine(rows, lines) {
  return Object.fromEntries(lines.map((l) => [l.id, rows
    .filter((r) => (l.payee ? r.to === l.payee && r.category !== "fees" : r.category === l.category))
    .reduce((t, r) => t + r.value, 0)]));
}

export function sumBy(rows, key) {
  const out = {};
  rows.forEach((r) => { out[r[key]] = (out[r[key]] ?? 0) + r.value; });
  return out;
}

// Planned spending per account for a budget version (where each line's money is kept)
export function plannedByAccount(version) {
  const out = {};
  BUDGET_LINES.forEach((l) => {
    let amount = version.amounts[l.id] ?? 0;
    if (l.id === "fees") { out.bsi = (out.bsi ?? 0) + FEES.biFast; out.bca = (out.bca ?? 0) + FEES.bcaMonthlyAdmin; return; }
    out[l.account] = (out[l.account] ?? 0) + amount;
  });
  return out;
}

export function runningBalance(ledger, nodeIds, opening = {}) {
  const set = new Set(nodeIds);
  let bal = nodeIds.reduce((t, id) => t + (opening[id] ?? 0), 0);
  return ledger.map((t) => {
    let delta = 0;
    if (isPosted(t)) {
      if (set.has(t.from)) delta -= t.amount + (t.fee ?? 0);
      if (set.has(t.to)) delta += t.amount;
      bal += delta;
    }
    return { id: t.id, delta, balance: bal };
  });
}

/* ---------- formatting ---------- */
const num = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
export const fmtPlain = (v) => num.format(Math.round(v));
export const rupiah = (v) => `${v < 0 ? "−" : ""}Rp${num.format(Math.abs(Math.round(v)))}`;
export const signed = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}Rp${num.format(Math.abs(Math.round(v)))}`;
export const pct = (v, digits = 1) => `${(v * 100).toFixed(digits)}%`;
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const weekdayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
export const fmtDate = (d) => dateFmt.format(typeof d === "string" ? toDate(d) : d);
export const fmtShort = (d) => shortFmt.format(typeof d === "string" ? toDate(d) : d);
export const fmtWeekday = (d) => weekdayFmt.format(typeof d === "string" ? toDate(d) : d);
