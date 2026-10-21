import "./dialog.js";
import { appIcon, el, icon } from "./dom.js";
import { APP_NAME, NAV, PRIMARY } from "./nav-config.js";

const normalize = (path) => path.replace(/index\.html$/, "").replace(/\/+$/, "") || "/";

function navItem(item, current) {
  return el("li", {},
    el("a", {
      class: "nav-item",
      href: item.href,
      title: item.label,
      "aria-current": normalize(item.href) === current ? "page" : null,
    }, appIcon(item.icon, item.color, "app-icon-plain"), el("span", { class: "nav-label" }, item.label)));
}

function renderSidebar(sidebar) {
  const current = normalize(location.pathname);
  const sectionActive = (section) => section.items.some((i) => normalize(i.href) === current);
  const anyActive = NAV.some(sectionActive);

  const header = el("div", { class: "sidebar-header" },
    el("a", { class: "sidebar-title", href: "/" },
      el("img", { class: "brand-glyph", src: "/assets/img/glyph.svg", alt: "", width: 22, height: 22 }),
      APP_NAME));

  const nav = el("nav", { class: "sidebar-nav", "aria-label": "Main navigation" },
    el("ul", { class: "nav-list nav-primary", role: "list" }, ...PRIMARY.map((item) => navItem(item, current))),
    ...NAV.map((section, index) => {
      // The section holding the current page is open. Elsewhere, the first section is open.
      const open = sectionActive(section) || (!anyActive && index === 0);
      return el("details", { class: "nav-section", name: "nav", open },
        el("summary", {}, el("span", {}, section.label), icon("chevron-right", "icon-sm nav-chevron")),
        el("ul", { class: "nav-list", role: "list" }, ...section.items.map((item) => navItem(item, current))));
    }));

  const footer = el("div", { class: "sidebar-footer" },
    el("button", { class: "nav-item", type: "button", "data-open-dialog": "dlg-sign-out" },
      icon("log-out"), el("span", { class: "nav-label" }, "Sign Out")));

  sidebar.replaceChildren(header, nav, footer);
}

// Sign-out confirmation. Cancel closes the dialog; Sign Out posts to /api/logout.
function renderSignOutDialog() {
  const dialog = el("dialog", {
    class: "dialog dialog-alert material material-thick",
    id: "dlg-sign-out",
    role: "alertdialog",
    "aria-labelledby": "sign-out-title",
    "aria-describedby": "sign-out-desc",
  },
    el("form", { class: "dialog-body", method: "post", action: "/api/logout" },
      el("div", { class: "dialog-alert-text" },
        appIcon("log-out", "red", "app-icon-lg"),
        el("h2", { class: "text-headline", id: "sign-out-title" }, "Sign out of Hub?"),
        el("p", { class: "text-subheadline text-secondary", id: "sign-out-desc" },
          "You'll need your password to sign back in.")),
      el("footer", { class: "dialog-footer" },
        el("button", { class: "btn btn-gray", type: "submit", formmethod: "dialog", value: "cancel", autofocus: true }, "Cancel"),
        el("button", { class: "btn btn-destructive", type: "submit" }, "Sign Out"))));
  document.body.append(dialog);
}

// No-scroll guard: warns in the console when the sidebar content outgrows the screen
function guardNoScroll(sidebar) {
  let timer;
  const check = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (sidebar.scrollHeight > sidebar.clientHeight + 1) {
        console.warn("[sidebar] Content is taller than the screen. Split a long section (no-scroll rule).");
      }
    }, 600); // wait for the accordion animation
  };
  new ResizeObserver(check).observe(sidebar);
  sidebar.addEventListener("toggle", check, true);
}

// Small screens: the sidebar becomes a drawer opened from the toolbar menu button
function setupDrawer(app, sidebar) {
  const main = document.getElementById("main");
  const toggles = [...document.querySelectorAll('[data-action="toggle-nav"]')];
  const isOpen = () => app.dataset.nav === "open";

  const setOpen = (open) => {
    app.dataset.nav = open ? "open" : "closed";
    if (main) main.inert = open;
    toggles.forEach((button) => button.setAttribute("aria-expanded", String(open)));
    if (open) sidebar.querySelector(".nav-item")?.focus();
  };

  toggles.forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(!isOpen());
  }));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen() && !document.querySelector("dialog[open]")) {
      setOpen(false);
      toggles[0]?.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (isOpen() && !sidebar.contains(event.target) && !event.target.closest("dialog")) setOpen(false);
  });

  matchMedia("(width >= 48rem)").addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
}

const sidebar = document.getElementById("sidebar");
const app = document.querySelector(".app");
if (sidebar && app) {
  renderSidebar(sidebar);
  renderSignOutDialog();
  guardNoScroll(sidebar);
  setupDrawer(app, sidebar);
}
