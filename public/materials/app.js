// Knowledge maps (/materials/<slug>): a two-sided mindmap read from materials/maps/peta-*.md, with the details
// of the chosen node underneath. Badges link to the other maps; starred nodes matter most to software engineers
// and architects. The maps are written as markdown; see mindmap.js for the format and the checks.
import { linksOf, MAPS, mapOfId, parseMap, checkMap } from "./mindmap.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const ic = (name, cls = "icon-sm") => `<svg class="icon ${cls}" aria-hidden="true"><use href="/assets/icons/sprite.svg#${name}"></use></svg>`;
const SYSTEM_SLUGS = { Finance: "finance", "Finance Self": "finance-self", Health: "health", Logistics: "logistics", "Game Esport": "game-esport", "Game Story": "game-story", Retail: "retail", Energy: "energy" };

const slug = location.pathname.replace(/\/+$/, "").split("/").pop();
const meta = MAPS.find((m) => m.slug === slug) ?? MAPS[0];
const state = { sel: null, open: new Set(), stars: false, choose: null };
let maps = {}, map = null, links = new Map();

// Every map that exists is loaded, so links point both ways across maps
async function loadMaps() {
  const found = await Promise.all(MAPS.filter((m) => m.ready).map(async (m) => {
    try {
      const res = await fetch(`/materials/maps/${m.file}`, { cache: "no-cache" });
      return res.ok ? [m.letter, parseMap(await res.text(), m.letter)] : null;
    } catch { return null; }
  }));
  maps = Object.fromEntries(found.filter(Boolean));
  map = maps[meta.letter] ?? null;
  links = linksOf(maps);
}

const nodeOf = (id) => maps[id?.[0]]?.nodes.get(id);
const linksFor = (id) => links.get(id) ?? [];
// The maps a node is linked to, most links first; ties follow menu order
function badgesFor(id) {
  const count = {};
  linksFor(id).forEach((l) => { const m = mapOfId(l.to); if (m && m.letter !== meta.letter) count[m.letter] = (count[m.letter] ?? 0) + 1; });
  return MAPS.filter((m) => count[m.letter]).sort((a, b) => count[b.letter] - count[a.letter] || MAPS.indexOf(a) - MAPS.indexOf(b));
}
const starredBelow = (n) => n.children.some((c) => c.star || starredBelow(c));

/* ---------- layout: branches split over two sides, topics beside them, subtopics under an open topic ---------- */
const G = { W: 1200, cx: 600, centerW: 156, centerH: 48, gap1: 64, branchW: 172, branchH: 40, gap2: 34, topicW: 226, topicH: 26, topicRow: 32, subW: 202, subH: 22, subRow: 26, blockGap: 20, pad: 24 };

function layout() {
  const branches = map.root;
  const height = (b) => b.children.reduce((t, c) => t + G.topicRow + (state.open.has(c.id) ? c.children.length * G.subRow : 0), 0);
  // The first branches, in learning order, go right; the split is where both sides come closest in height
  const hs = branches.map((b) => Math.max(height(b), G.branchH) + G.blockGap);
  const total = hs.reduce((t, h) => t + h, 0);
  let k = 1, best = Infinity, acc = 0;
  hs.forEach((h, i) => { acc += h; if (i < hs.length - 1 && Math.abs(acc - total / 2) < best) { best = Math.abs(acc - total / 2); k = i + 1; } });
  const right = branches.slice(0, k), left = branches.slice(k);
  const sideH = (list) => list.reduce((t, b) => t + Math.max(height(b), G.branchH) + G.blockGap, -G.blockGap);
  const H = Math.max(sideH(right), sideH(left), G.centerH) + G.pad * 2;
  const pos = new Map();
  const place = (list, dir) => {
    let y = (H - sideH(list)) / 2;
    list.forEach((b) => {
      const h = Math.max(height(b), G.branchH);
      const bx = dir > 0 ? G.cx + G.centerW / 2 + G.gap1 : G.cx - G.centerW / 2 - G.gap1 - G.branchW;
      pos.set(b.id, { x: bx, y: y + h / 2 - G.branchH / 2, w: G.branchW, h: G.branchH, dir, level: 1 });
      let ty = y + (h - height(b)) / 2;
      b.children.forEach((t) => {
        const tx = dir > 0 ? bx + G.branchW + G.gap2 : bx - G.gap2 - G.topicW;
        pos.set(t.id, { x: tx, y: ty + (G.topicRow - G.topicH) / 2, w: G.topicW, h: G.topicH, dir, level: 2 });
        ty += G.topicRow;
        if (state.open.has(t.id)) t.children.forEach((s) => {
          const sx = dir > 0 ? tx + G.topicW - G.subW : tx;
          pos.set(s.id, { x: sx, y: ty + (G.subRow - G.subH) / 2, w: G.subW, h: G.subH, dir, level: 3 });
          ty += G.subRow;
        });
      });
      y += h + G.blockGap;
    });
  };
  place(right, 1);
  place(left, -1);
  return { H, pos };
}

function curve(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} C${mx.toFixed(1)} ${y1.toFixed(1)} ${mx.toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

// Short labels fit on one line; long branch labels wrap to two
function textLines(label, max) {
  if (label.length <= max) return [label];
  const words = label.split(" ");
  let a = "";
  while (words.length && (a + " " + words[0]).trim().length <= max) a = (a + " " + words.shift()).trim();
  return [a, words.join(" ")];
}

function nodeSVG(n, p) {
  const cls = ["mm-node", `is-l${p.level}`, n.ref && "is-ref", n.bridge && "is-bridge", n.id === state.sel && "is-sel", state.stars && !n.star && !starredBelow(n) && "is-dim"].filter(Boolean).join(" ");
  const badges = badgesFor(n.id);
  const hasKids = p.level === 2 && n.children.length;
  // Text starts on the side facing the center; extras (star, badges, +n) sit on the outer end
  const pad = 10;
  const textX = p.x + pad;
  let extras = "";
  let ex = p.x + p.w - pad;
  if (hasKids) {
    const open = state.open.has(n.id);
    extras += `<text class="mm-more" x="${ex}" y="${p.y + p.h / 2 + 4}" text-anchor="end">${open ? "−" : `+${n.children.length}`}</text>`;
    ex -= open ? 12 : 20;
  }
  badges.forEach((m) => {
    const bw = m.short.length * 6 + 12;
    ex -= bw;
    extras += `<g class="mm-badge" data-badge="${m.letter}" data-from="${n.id}"><rect x="${ex}" y="${p.y + p.h / 2 - 8}" width="${bw}" height="16" rx="8"/><text x="${ex + bw / 2}" y="${p.y + p.h / 2 + 3.5}" text-anchor="middle">${m.short}</text></g>`;
    ex -= 4;
  });
  const parentBridge = n.parent && nodeOf(n.parent)?.bridge;
  if (n.bridge && !parentBridge) {
    const tw = 44;
    ex -= tw;
    extras += `<g class="mm-tag"><rect x="${ex}" y="${p.y + p.h / 2 - 8}" width="${tw}" height="16" rx="8"/><text x="${ex + tw / 2}" y="${p.y + p.h / 2 + 3.5}" text-anchor="middle">S2 prep</text></g>`;
    ex -= 4;
  }
  if (n.star) extras += `<path class="mm-star" transform="translate(${ex - 13} ${p.y + p.h / 2 - 6.5}) scale(0.54)" d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.5l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>`;
  // The label gets whatever room the star, tags, and badges leave; long ones wrap to two lines
  const room = ex - (n.star ? 16 : 0) - textX - 6;
  const lines = textLines(n.label, Math.max(8, Math.floor(room / (p.level === 1 ? 7.3 : p.level === 3 ? 5.8 : 6))));
  const ty = p.y + p.h / 2 + (lines.length === 2 ? -3 : 4);
  return `<g class="${cls}" data-id="${n.id}" tabindex="0" role="button" aria-pressed="${n.id === state.sel}" aria-label="${esc(`${n.id} ${n.label}${n.star ? ", starred" : ""}${hasKids ? `, ${n.children.length} subtopics` : ""}`)}">` +
    `<rect class="mm-box" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.level === 3 ? 6 : 8}"/>` +
    lines.map((l, i) => `<text class="mm-label" x="${textX}" y="${ty + i * 13}">${esc(l)}</text>`).join("") + extras + `</g>`;
}

function drawMap() {
  const { H, pos } = layout();
  const cy = H / 2;
  let wires = "", nodes = "";
  map.root.forEach((b) => {
    const p = pos.get(b.id);
    const from = p.dir > 0 ? G.cx + G.centerW / 2 : G.cx - G.centerW / 2;
    const to = p.dir > 0 ? p.x : p.x + p.w;
    wires += `<path class="mm-wire is-l1${state.stars && !starredBelow(b) ? " is-dim" : ""}" d="${curve(from, cy, to, p.y + p.h / 2)}"/>`;
    nodes += nodeSVG(b, p);
    b.children.forEach((t) => {
      const q = pos.get(t.id);
      const a = p.dir > 0 ? p.x + p.w : p.x;
      const z = q.dir > 0 ? q.x : q.x + q.w;
      wires += `<path class="mm-wire${state.stars && !t.star && !starredBelow(t) ? " is-dim" : ""}" d="${curve(a, p.y + p.h / 2, z, q.y + q.h / 2)}"/>`;
      nodes += nodeSVG(t, q);
      if (state.open.has(t.id)) t.children.forEach((s) => {
        const r = pos.get(s.id);
        const sx = q.dir > 0 ? q.x + q.w - r.w - 10 : q.x + r.w + 10;
        const ex = q.dir > 0 ? r.x : r.x + r.w;
        wires += `<path class="mm-wire is-l3${state.stars && !s.star ? " is-dim" : ""}" d="M${sx} ${q.y + q.h} V${r.y + r.h / 2 - 5} Q${sx} ${r.y + r.h / 2} ${sx + (ex - sx > 0 ? 5 : -5)} ${r.y + r.h / 2} H${ex}"/>`;
        nodes += nodeSVG(s, r);
      });
    });
  });
  const center = `<g class="mm-node is-center${state.sel === null ? " is-sel" : ""}" data-id="" tabindex="0" role="button" aria-label="${esc(map.title)}, the whole map">` +
    `<rect class="mm-box" x="${G.cx - G.centerW / 2}" y="${cy - G.centerH / 2}" width="${G.centerW}" height="${G.centerH}" rx="${G.centerH / 2}"/>` +
    `<text class="mm-label" x="${G.cx}" y="${cy + 5}" text-anchor="middle">${esc(map.title)}</text></g>`;
  const svg = $("#mm-map");
  svg.setAttribute("viewBox", `0 0 ${G.W} ${H}`);
  svg.innerHTML = `<g>${wires}</g><g>${nodes}${center}</g>`;
}

/* ---------- details of the chosen node ---------- */
function pathOf(n) {
  const path = [];
  for (let x = n; x; x = x.parent ? nodeOf(x.parent) : null) path.unshift(x);
  return path;
}

function nodeLink(id, extra = "") {
  const n = nodeOf(id);
  const m = mapOfId(id);
  if (!n) return `<span class="mm-missing">${esc(id)} (not written yet)</span>`;
  const same = m.letter === meta.letter;
  return same
    ? `<button type="button" class="mm-link" data-go="${id}"><span class="mm-id">${id}</span>${esc(n.label)}${extra}</button>`
    : `<a class="mm-link" href="/materials/${m.slug}#${id}"><span class="mm-badge-inline">${m.short}</span><span class="mm-id">${id}</span>${esc(n.label)}${extra}</a>`;
}

function detail() {
  const box = $("#mm-detail");
  if (!state.sel) {
    const all = [...map.nodes.values()];
    const stars = all.filter((n) => n.star);
    box.innerHTML = `<header class="mm-head"><span class="mm-id is-big">${meta.letter}</span><div><p class="text-footnote text-secondary">Map</p><h2 class="text-title-3 strong">${esc(map.title)}</h2></div></header>
      <p class="text-subheadline text-secondary">${esc(map.core)}</p>
      <div class="mm-stats"><div><b>${map.root.length}</b><span>branches</span></div><div><b>${all.filter((n) => n.depth === 2).length}</b><span>topics</span></div><div><b>${all.filter((n) => n.depth === 3).length}</b><span>subtopics</span></div><div><b>${stars.length}</b><span>starred</span></div><div><b>${all.filter((n) => n.bridge).length}</b><span>S2 prep</span></div></div>
      <section><h3>Starred for software engineers and architects</h3><ul class="mm-list">${stars.map((n) => `<li>${nodeLink(n.id)}<span class="mm-why">${esc(n.star)}</span></li>`).join("")}</ul></section>`;
    return;
  }
  const n = nodeOf(state.sel);
  const owner = n.ref ? nodeOf(n.ref) : null;
  const core = n.ref ? owner?.core : n.core;
  const kinds = { depth: ["", "Branch", "Topic", "Subtopic"][n.depth] };
  const crumbs = pathOf(n).map((x) => (x.id === n.id ? `<span>${esc(x.label)}</span>` : `<button type="button" class="mm-crumb" data-go="${x.id}">${esc(x.label)}</button>`));
  const row = (title, body) => (body ? `<section><h3>${title}</h3>${body}</section>` : "");
  const own = linksFor(n.id);
  const linkList = (kind) => own.filter((l) => l.kind === kind).map((l) => `<li>${nodeLink(l.to)}${l.reason ? `<span class="mm-why">${esc(l.reason)}</span>` : ""}</li>`).join("");
  const choose = state.choose
    ? `<section class="mm-choose"><h3>Open in ${esc(mapOfId(state.choose).short)}</h3><ul class="mm-list">${own.filter((l) => l.to[0] === state.choose).map((l) => `<li>${nodeLink(l.to)}</li>`).join("")}</ul></section>`
    : "";
  const systems = n.systems.map((s) => s.raw
    ? `<li>${esc(s.raw)}</li>`
    : `<li><a class="mm-link" href="/systems/${SYSTEM_SLUGS[s.map] ?? ""}/">${esc(s.map)} map</a><span class="mm-why">${esc(s.area)} · system ${s.number}</span></li>`).join("");
  box.innerHTML = `<nav class="mm-crumbs" aria-label="Where this node sits">${[`<button type="button" class="mm-crumb" data-go="">${esc(map.title)}</button>`, ...crumbs].join(ic("chevron-right"))}</nav>
    <header class="mm-head"><span class="mm-id is-big">${n.id}</span><div><p class="text-footnote text-secondary">${kinds.depth}${n.ref ? " · reference" : ""}</p><h2 class="text-title-3 strong">${esc(n.name ?? n.label)}</h2></div></header>
    <p class="text-subheadline">${esc(core ?? "")}</p>
    ${n.ref ? `<p class="mm-owner">Owner: ${nodeLink(n.ref)}</p>` : ""}
    ${n.bridge ? `<p class="mm-bridge-note"><span class="mm-tag-inline">S2 prep</span><span>A bridge from S1 toward S2: more rigor and abstraction than S1, without full graduate depth.</span></p>` : ""}
    ${n.star ? `<p class="mm-star-note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.5l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/></svg><span><b>Why engineers and architects need it.</b> ${esc(n.star)}</span></p>` : ""}
    ${choose}
    <div class="mm-sections">
      ${row(n.depth === 1 ? "Topics" : "Subtopics", n.children.length ? `<ul class="mm-list">${n.children.map((c) => `<li>${nodeLink(c.id, c.star ? ` <span class="mm-star-mini" aria-label="starred">★</span>` : "")}</li>`).join("")}</ul>` : "")}
      ${row("Needs first", linkList("needs") ? `<ul class="mm-list">${linkList("needs")}</ul>` : "")}
      ${row("Basis for", linkList("basis") ? `<ul class="mm-list">${linkList("basis")}</ul>` : "")}
      ${row("Referenced in", linkList("referenced") ? `<ul class="mm-list">${linkList("referenced")}</ul>` : "")}
      ${row("See also", n.seeAlso.length ? `<ul class="mm-list">${n.seeAlso.map((id) => `<li>${nodeLink(id)}</li>`).join("")}</ul>` : "")}
      ${row("Used in system maps", systems ? `<ul class="mm-list">${systems}</ul>` : "")}
    </div>`;
}

/* ---------- actions ---------- */
function render() { drawMap(); detail(); }

function select(id, { scroll = false } = {}) {
  state.choose = null;
  state.sel = id || null;
  if (id) {
    const n = nodeOf(id);
    if (n?.depth === 3) state.open.add(n.parent);
    if (n?.depth === 2 && n.children.length) state.open.add(n.id);
  }
  history.replaceState(null, "", id ? `#${id}` : location.pathname);
  render();
  if (scroll) document.querySelector(`[data-id="${CSS.escape(id ?? "")}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
}

function bind() {
  const svg = $("#mm-map");
  const pick = (target) => {
    const badge = target.closest(".mm-badge");
    if (badge) {
      // One target: go there. Several: list them first.
      const targets = linksFor(badge.dataset.from).filter((l) => l.to[0] === badge.dataset.badge);
      if (targets.length === 1) { location.assign(`/materials/${mapOfId(targets[0].to).slug}#${targets[0].to}`); return; }
      select(badge.dataset.from);
      state.choose = badge.dataset.badge;
      detail();
      return;
    }
    const g = target.closest(".mm-node");
    if (!g) return;
    const id = g.dataset.id;
    const n = nodeOf(id);
    // Clicking an open, selected topic closes it again
    if (n?.depth === 2 && n.children.length && state.sel === id && state.open.has(id)) { state.open.delete(id); render(); return; }
    select(id);
  };
  svg.addEventListener("click", (e) => pick(e.target));
  svg.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.closest(".mm-node")) { e.preventDefault(); pick(e.target); } });
  $("#mm-detail").addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (b) select(b.dataset.go, { scroll: true });
  });
  $("#mm-stars").addEventListener("click", () => {
    state.stars = !state.stars;
    $("#mm-stars").setAttribute("aria-pressed", String(state.stars));
    if (state.stars) map.nodes.forEach((n) => { if (n.depth === 2 && starredBelow(n)) state.open.add(n.id); });
    render();
  });
  $("#mm-expand").addEventListener("click", () => {
    const allOpen = [...map.nodes.values()].filter((n) => n.depth === 2 && n.children.length).every((n) => state.open.has(n.id));
    map.nodes.forEach((n) => { if (n.depth === 2 && n.children.length) (allOpen ? state.open.delete(n.id) : state.open.add(n.id)); });
    $("#mm-expand span").textContent = allOpen ? "Open all" : "Close all";
    render();
  });
  addEventListener("hashchange", () => { const id = location.hash.slice(1); if (nodeOf(id)) select(id, { scroll: true }); });
}

function empty() {
  $(".mm-actions").hidden = true;
  $("#mt-view").innerHTML = `<section class="card mm-empty">${ic("graduation-cap", "icon-lg")}<h2 class="text-title-3 strong">${esc(meta.title)} isn't written yet</h2>
    <p class="text-subheadline text-secondary">Write public/materials/maps/${meta.file} in the same format as the Math map, then set ready to true for it in materials/mindmap.js.</p>
    <a class="btn btn-gray btn-sm" href="/materials/${MAPS[0].slug}">Open the Math map</a></section>`;
}

await loadMaps();
document.title = `${meta.title} - Hub`;
$("#mt-title").textContent = meta.title;
if (!map) {
  $("#mt-sub").textContent = "Not written yet";
  empty();
} else {
  const all = [...map.nodes.values()];
  $("#mt-sub").textContent = `${all.length} nodes · ${all.filter((n) => n.star).length} starred · ${all.filter((n) => n.bridge).length} S2 prep`;
  // The legend only explains what this map actually has
  if (!all.some((n) => badgesFor(n.id).length)) $(".mm-legend-badge").parentElement.hidden = true;
  if (!all.some((n) => n.ref)) $(".mm-legend-ref").parentElement.hidden = true;
  if (!all.some((n) => n.bridge)) $(".mm-legend-tag").parentElement.hidden = true;
  const problems = checkMap(map, maps);
  if (problems.length) console.warn(`[${meta.short} map] checklist:\n${problems.join("\n")}`);
  bind();
  const start = location.hash.slice(1);
  if (nodeOf(start)) select(start, { scroll: true }); else render();
}
