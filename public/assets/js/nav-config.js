// The only file to edit when adding a page. The sidebar and home screen are both built from it.
// color is an app icon color from app-icon.css: blue, green, indigo, orange, pink, purple, red, teal, yellow, cyan, mint, brown, gray.
export const APP_NAME = "Hub";

// Main menu, always visible at the top of the sidebar
export const PRIMARY = [
  { label: "Home", href: "/", icon: "house", color: "gray" },
  {
    label: "Finance Management",
    href: "/finance-management/",
    icon: "wallet",
    color: "green",
    description: "Accounts, budgets, and cash flow in one place.",
    app: true,
  },
];

export const NAV = [
  {
    id: "systems",
    label: "Systems",
    icon: "server",
    color: "indigo",
    items: [
      { label: "Finance", href: "/systems/finance/", icon: "landmark", color: "blue", status: "1,006 systems" },
      { label: "Finance Self", href: "/systems/finance-self/", icon: "piggy-bank", color: "pink", status: "327 systems" },
      { label: "Health", href: "/systems/health/", icon: "heart-pulse", color: "red", status: "469 systems" },
      { label: "Logistics", href: "/systems/logistics/", icon: "truck", color: "orange", status: "373 systems" },
      { label: "Game Esport", href: "/systems/game-esport/", icon: "gamepad-2", color: "purple", status: "357 systems" },
      { label: "Game Story", href: "/systems/game-story/", icon: "book-open", color: "indigo", status: "364 systems" },
      { label: "Retail", href: "/systems/retail/", icon: "factory", color: "brown", status: "444 systems" },
      { label: "Energy", href: "/systems/energy/", icon: "zap", color: "yellow", status: "405 systems" },
    ],
  },
  {
    id: "materials",
    label: "Materials",
    icon: "graduation-cap",
    color: "teal",
    items: [
      { label: "Mathematics", href: "/materials/mathematics/", icon: "sigma", color: "blue" },
      { label: "Statistics", href: "/materials/statistics/", icon: "chart-column", color: "green" },
      { label: "Data", href: "/materials/data/", icon: "database", color: "orange" },
      { label: "Artificial Intelligence", href: "/materials/artificial-intelligence/", icon: "bot", color: "purple" },
    ],
  },
];
