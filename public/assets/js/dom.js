// Element and icon builders, shared by the sidebar, home screen, toasts, and the Maps renderer.
const SPRITE = "/assets/icons/sprite.svg";
const SVG_NS = "http://www.w3.org/2000/svg";

export function icon(name, extraClass = "icon-md") {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", `icon ${extraClass}`.trim());
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", `${SPRITE}#${name}`);
  svg.append(use);
  return svg;
}

// Colored rounded-square app icon with a white glyph
export function appIcon(name, color, sizeClass = "") {
  return el("span", { class: `app-icon ${sizeClass}`.trim(), "data-color": color, "aria-hidden": "true" }, icon(name, ""));
}

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) continue;
    node.setAttribute(key, value === true ? "" : String(value));
  }
  node.append(...children); // strings become plain text, safe from XSS
  return node;
}
