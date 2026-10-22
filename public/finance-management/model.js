// Personal finance model, taken from alur-keuangan.md (version 21 Oct 2026).
// Fixed rules and budgets live here. Every transaction is entered in the app and kept in the database (api/finance.js).

export const CURRENCY = "IDR";
export const SALARY = 5729876;
export const PAYDAY = 21;                    // salary arrives on the 21st, or the next workday
export const FIRST_PERIOD_START = "2026-10-21"; // nothing before this period is kept
// Public holidays (YYYY-MM-DD) that push payday to the next workday. Weekends always do.
export const HOLIDAYS = [];

export const FEES = {
  biFast: 2500,          // BSI to SeaBank, once a month
  bcaMonthlyAdmin: 20000, // black BCA debit card, charged at the start of the month
};

// Accounts. Balances come from the ledger, never typed in. brand matches [data-brand] in finance-management.css.
export const ACCOUNTS = [
  { id: "bsi", name: "BSI", kind: "bank", role: "Salary arrives here", logo: "bsi" },
  { id: "seabank", name: "SeaBank", kind: "bank", role: "Rent and Telkomsel Halo", logo: "seabank" },
  { id: "bca", name: "BCA", kind: "bank", role: "Pockets for savings and spending", logo: "bca" },
  { id: "jago", name: "Jago", kind: "bank", role: "Pays PLN and IndiHome", logo: "jago" },
];

// BCA pockets. fill: what goes in on payday (null when it changes).
export const POCKETS = [
  { id: "bca.main", name: "Main", purpose: "Daily spending", fill: 20000, rule: "Gets a week of food every Monday. Every night, what's left of the day's food moves to Bonus." },
  { id: "bca.ef", name: "Emergency Fund", purpose: "Savings and the bills bridge", fill: null, rule: "Not locked, because it bridges PLN and IndiHome every month." },
  { id: "bca.food", name: "Food", purpose: "A month of meals", fill: 956000, rule: "Every Monday, a week of food moves to Main." },
  { id: "bca.claude", name: "Claude", purpose: "Claude subscription", fill: 405000, rule: "Moves to Main before the bill. Leftover to Bonus." },
  { id: "bca.daily", name: "Daily Needs", purpose: "Soap, laundry, haircut, small surprises, birthdays", fill: 200000, rule: "One pocket for daily needs and small surprises. Leftover at period end goes to Bonus." },
  { id: "bca.bonus", name: "Bonus", purpose: "Budget leftovers", fill: 0, rule: "At period end it moves to the Emergency Fund or a Device Fund." },
];

export const MAIN_RESERVE = 20000; // left in Main for the monthly admin fee

// Everything money can move between: accounts, pockets, and outside parties
export const NODES = {
  bsi: { label: "BSI", account: "bsi" },
  seabank: { label: "SeaBank", account: "seabank" },
  jago: { label: "Jago", account: "jago" },
  ...Object.fromEntries(POCKETS.map((p) => [p.id, { label: `BCA ${p.name}`, account: "bca", pocket: p.id }])),
  employer: { label: "Employer", external: true },
  parents: { label: "Parents", external: true },
  landlord: { label: "Landlord", external: true },
  telkomsel: { label: "Telkomsel Halo", external: true },
  pln: { label: "PLN", external: true },
  indihome: { label: "IndiHome", external: true },
  anthropic: { label: "Claude", external: true },
  merchants: { label: "Shops and food", external: true },
  bank: { label: "Bank fee", external: true },
  others: { label: "Other payee", external: true },
  opening: { label: "Opening balance", external: true },
};

// How outside parties look: the company logo when there is one (assets/img/bills), else a glyph in its color
export const PARTY_STYLE = {
  employer: { icon: "briefcase", brand: "ink" },
  parents: { icon: "users", brand: "ink" },
  landlord: { icon: "home", brand: "rent" },
  telkomsel: { icon: "phone", brand: "telkomsel", logo: "telkomsel" },
  pln: { icon: "bolt", brand: "pln", logo: "pln" },
  indihome: { icon: "wifi", brand: "indihome", logo: "indihome" },
  anthropic: { icon: "card", brand: "ink" },
  merchants: { icon: "utensils", brand: "food" },
  bank: { icon: "percent", brand: "ink" },
  others: { icon: "box", brand: "ink" },
  opening: { icon: "book", brand: "ink" },
};

// Categories follow the budget lines; anything else is Others. from and to fill the entry form.
// pick: shown in the expense form. Income, transfers, and opening balances have their own.
export const CATEGORIES = {
  food: { label: "Food", icon: "utensils", brand: "food", pick: true, from: "bca.main", to: "merchants" },
  daily: { label: "Daily needs", icon: "box", brand: "ink", pick: true, from: "bca.daily", to: "merchants" },
  utilities: { label: "Utilities", icon: "bolt", brand: "pln", pick: true, from: "bca.ef", to: "pln" }, // PLN or IndiHome, picked in To
  phone: { label: "Telkomsel Halo", icon: "phone", brand: "telkomsel", pick: true, from: "seabank", to: "telkomsel" },
  rent: { label: "Rent", icon: "home", brand: "rent", pick: true, from: "seabank", to: "landlord" },
  subscriptions: { label: "Claude", icon: "card", brand: "ink", pick: true, from: "bca.claude", to: "anthropic" },
  fees: { label: "Fees", icon: "percent", brand: "ink", pick: true, from: "bca.main", to: "bank" },
  others: { label: "Others", icon: "grid", brand: "ink", pick: true, from: "bca.bonus", to: "others" },
  income: { label: "Income", icon: "arrowin", brand: "ink", from: "employer", to: "bsi" },
  transfer: { label: "Transfer", icon: "swap", brand: "ink", from: "bca.main", to: "bca.bonus" },
  savings: { label: "Savings", icon: "vault", brand: "ink", from: "bca.main", to: "bca.ef" },
  opening: { label: "Opening balance", icon: "book", brand: "ink", from: "opening", to: "bca.ef" },
};
export const LINE_GROUPS = [
  { id: "fixed", label: "Fixed", sub: "Same every month" },
  { id: "variable", label: "Changes", sub: "Moves with how you live" },
];

// Spending that counts against the day's limit in the calendar
export const DAILY_LIMIT_CATEGORIES = ["food", "others"];

// Budget lines. fixed: the same every month (bills and fees); the rest changes month to month.
export const BUDGET_LINES = [
  { id: "rent", name: "Rent", fixed: true, category: "rent", payee: "landlord", keptIn: "seabank", account: "seabank" },
  { id: "claude", name: "Claude", fixed: true, category: "subscriptions", payee: "anthropic", keptIn: "bca.claude", account: "bca" },
  { id: "halo", name: "Telkomsel Halo", fixed: true, category: "phone", payee: "telkomsel", keptIn: "seabank", account: "seabank" },
  { id: "indihome", name: "IndiHome", fixed: true, category: "utilities", payee: "indihome", keptIn: "bca.ef", account: "bca" },
  { id: "fees", name: "Fees (BI-FAST + BCA admin)", fixed: true, category: "fees", keptIn: "bsi", account: "bsi", note: "BI-FAST 2,500 from BSI, BCA admin 20,000 from Main" },
  { id: "pln", name: "PLN", category: "utilities", payee: "pln", keptIn: "bca.ef", account: "bca", note: "Budgeted at its highest (395,000), usually about 385,000." },
  { id: "food", name: "Food", category: "food", keptIn: "bca.food", account: "bca" },
  { id: "daily", name: "Daily Needs", category: "daily", keptIn: "bca.daily", account: "bca" },
];

// Budget versions. A version applies from the first period that starts on or after "from".
// These are the defaults; amounts you change in Plan are saved in the database and laid over them
// (see useSavedBudgets). salary falls back to SALARY when a version has none.
export const DEFAULT_BUDGET_VERSIONS = [
  {
    id: "2026-10-21",
    label: "From Oct 2026",
    from: "2026-10-21",
    amounts: { rent: 1800000, claude: 405000, halo: 111000, pln: 395000, indihome: 237000, food: 956000, daily: 200000, fees: 22500 },
    parentsHelp: 0,
  },
  {
    id: "2026-11-21",
    label: "From Nov 2026",
    from: "2026-11-21",
    amounts: { rent: 1800000, claude: 405000, halo: 111000, pln: 245000, indihome: 237000, food: 956000, daily: 200000, fees: 22500 },
    parentsHelp: 150000, // goes to PLN: the PLN line is what you pay, 395,000 − 150,000
  },
];

// The versions in use: the defaults, with any saved version replacing the default from the same date
export const BUDGET_VERSIONS = [...DEFAULT_BUDGET_VERSIONS];

const monthYear = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });
export function useSavedBudgets(saved) {
  const custom = saved.map((v) => ({
    id: v.from, from: v.from, custom: true, salary: v.salary, amounts: v.amounts, parentsHelp: v.parentsHelp,
    label: `From ${monthYear.format(new Date(`${v.from}T00:00:00`))}`,
  }));
  const taken = new Set(custom.map((v) => v.from));
  const merged = [...DEFAULT_BUDGET_VERSIONS.filter((v) => !taken.has(v.from)), ...custom].sort((a, b) => a.from.localeCompare(b.from));
  BUDGET_VERSIONS.splice(0, BUDGET_VERSIONS.length, ...merged);
}

// Food plan (section 5). Budget day counts are fixed; the calendar shows the real ones.
export const MEAL_PLAN = {
  regular: { label: "Regular workday", short: "workdays", budgetDays: 14, lunch: 20000, dinner: 18000 },
  fasting: { label: "Monday-Thursday fast", short: "fast days", budgetDays: 8, lunch: 0, dinner: 23000, weekdays: [1, 4], startsOn: "2026-10-26" },
  weekend: { label: "Weekend", short: "days off", budgetDays: 8, lunch: 0, dinner: 30000, weekdays: [0, 6] },
};
export const WEEKLY_FOOD_MOVE = 220000; // 3 regular + 2 fasting + 2 weekend days

// Recurring bills (section 7). due: the last day to pay; any day from the 2nd is fine.
export const BILLS = [
  { id: "rent", name: "Rent", amount: 1800000, from: "seabank", window: "On the rent bill date", to: "landlord" },
  { id: "halo", name: "Telkomsel Halo", amount: 111000, from: "seabank", window: "2nd to 20th", to: "telkomsel" },
  { id: "indihome", name: "IndiHome", amount: 237000, from: "bca.ef", via: "Jago", window: "2nd to 20th", to: "indihome" },
  { id: "pln", name: "PLN", amount: 395000, from: "bca.ef", via: "Jago", window: "Bill on the 2nd-3rd, due the 20th", to: "pln" },
  { id: "bca-admin", name: "BCA admin", amount: 20000, from: "bca.main", window: "Start of the month", to: "bank" },
  { id: "claude", name: "Claude", amount: 405000, from: "bca.claude", window: "On the Claude bill date", to: "anthropic" },
];

// What the Emergency Fund is saving toward
export const SAVINGS_TARGET = 9800000;

export const RULES = [
  "The budget is fixed. Anything spent under budget is a bonus and is saved.",
  "Every night, what's left of the day's food money in Main moves to Bonus.",
  "Utilities go to the Emergency Fund in full every payday (632,000, or 482,000 + 150,000 from parents), whatever the real bill. The difference becomes savings.",
  "Bills due before payday (IndiHome, PLN, Telkomsel Halo) are paid from last month's money or bridged by the Emergency Fund.",
  "The Emergency Fund is only for big emergencies and bridges with a clear amount and return date.",
  "Small surprises and birthdays come from Daily Needs first, not the Emergency Fund.",
  "Impulse spending never comes from the Emergency Fund. Cover it from Bonus or save on another day that week.",
  "Pay PLN and IndiHome through Jago, and check its promos for the lowest final total: bill + admin − discount or cashback.",
  "Avoid small transfers out of BCA (2,500 each). Moving between BCA pockets is free.",
  "Before buying, ask: if I don't buy it, is there a problem?",
];

export const OPEN_QUESTIONS = [
  "Lunch and dinner split on regular workdays (assumed 20,000 and 18,000).",
  "Bonus at period end: to the Emergency Fund, or saved as a Device Fund.",
  "Rent: stay at 1,800,000 or move to a closer place at 2,000,000.",
];
