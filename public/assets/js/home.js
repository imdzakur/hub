// Home screen: greeting, overview, apps, and the Systems and Maps lists.
// Everything comes from nav-config.js so it always matches the sidebar.
import { appIcon, el, icon } from "./dom.js";
import { NAV, PRIMARY } from "./nav-config.js";

const NOT_BUILT = "Not built yet";
const APPS = PRIMARY.filter((item) => item.app);

function greeting(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function renderStats() {
  const stats = [
    { label: "Apps", value: APPS.length, icon: "wallet", color: "green" },
    ...NAV.map((section) => ({ label: section.label, value: section.items.length, icon: section.icon, color: section.color })),
  ];
  return stats.map((stat) =>
    el("li", { class: "card stat" },
      appIcon(stat.icon, stat.color, "app-icon-lg"),
      el("span", { class: "stat-value" }, String(stat.value)),
      el("span", { class: "stat-label" }, stat.label)));
}

function renderApps() {
  return APPS.map((item) =>
    el("a", { class: "card app-card", href: item.href },
      appIcon(item.icon, item.color, "app-icon-lg"),
      el("span", { class: "app-card-text" },
        el("span", { class: "app-card-title" }, item.label),
        el("span", { class: "app-card-desc" }, item.description ?? "")),
      icon("chevron-right", "icon-sm app-card-chevron")));
}

function renderSection(section) {
  const headerId = `list-${section.id}`;
  return el("section", { class: "list-section", "aria-labelledby": headerId },
    el("h2", { class: "list-header", id: headerId }, section.label),
    el("ul", { class: "list list-has-icons", role: "list" },
      ...section.items.map((item) =>
        el("li", {},
          el("a", { class: "list-row", href: item.href },
            appIcon(item.icon, item.color),
            el("span", { class: "list-title" }, item.label),
            el("span", { class: "list-value" }, item.status ?? NOT_BUILT),
            icon("chevron-right", "icon-sm list-chevron"))))));
}

const now = new Date();
document.getElementById("home-greeting").textContent = greeting(now.getHours());
document.getElementById("home-date").textContent =
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(now);
document.getElementById("home-stats").replaceChildren(...renderStats());
document.getElementById("home-apps").replaceChildren(...renderApps());
document.getElementById("home-lists").replaceChildren(...NAV.map(renderSection));
