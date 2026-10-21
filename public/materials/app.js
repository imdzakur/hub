// Knowledge maps (/materials/<slug>/): a compact two-sided mindmap read from materials/maps/peta-*.md.
// Only the center, the branches, and the topics are drawn; hovering a node shows its one-line core.
// Stars mark what matters most to software engineers and architects; badges link to the other maps.
import { linksOf, MAPS, mapOfId, parseMap, checkMap } from "./mindmap.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const STAR = "M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.5l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z";

const slug = location.pathname.replace(/\/+$/, "").split("/").pop();
const meta = MAPS.find((m) => m.slug === slug) ?? MAPS[0];
const state = { sel: null, stars: false };
let maps = {}, map = null, links = new Map();

// Every written map is loaded, so links point both ways across maps
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
const starredHere = (n) => Boolean(n.star) || n.children.some((c) => c.star);

/* ---------- layout: branches on two sides, their topics stacked beside them ---------- */
const G = { W: 1000, cx: 500, centerW: 140, centerH: 40, gap1: 52, branchW: 150, branchH: 30, gap2: 28, topicW: 178, topicH: 20, topicRow: 25, blockGap: 16, pad: 18 };

function layout() {
  const branches = map.root;
  const height = (b) => Math.max(b.children.length * G.topicRow, G.branchH);
  // The first branches, in learning order, go right; the split is where both sides come closest in height
  const hs = branches.map((b) => height(b) + G.blockGap);
  const total = hs.reduce((t, h) => t + h, 0);
  let k = 1, best = Infinity, acc = 0;
  hs.forEach((h, i) => { acc += h; if (i < hs.length - 1 && Math.abs(acc - total / 2) < best) { best = Math.abs(acc - total / 2); k = i + 1; } });
  const sides = [[branches.slice(0, k), 1], [branches.slice(k), -1]];
  const sideH = (list) => list.reduce((t, b) => t + height(b) + G.blockGap, -G.blockGap);
  const H = Math.max(...sides.map(([l]) => sideH(l)), G.centerH) + G.pad * 2;
  const pos = new Map();
  sides.forEach(([list, dir]) => {
    let y = (H - sideH(list)) / 2;
    list.forEach((b) => {
      const h = height(b);
      const bx = dir > 0 ? G.cx + G.centerW / 2 + G.gap1 : G.cx - G.centerW / 2 - G.gap1 - G.branchW;
      pos.set(b.id, { x: bx, y: y + h / 2 - G.branchH / 2, w: G.branchW, h: G.branchH, dir, level: 1 });
      const tx = dir > 0 ? bx + G.branchW + G.gap2 : bx - G.gap2 - G.topicW;
      let ty = y + (h - b.children.length * G.topicRow) / 2;
      b.children.forEach((t) => {
        pos.set(t.id, { x: tx, y: ty + (G.topicRow - G.topicH) / 2, w: G.topicW, h: G.topicH, dir, level: 2 });
        ty += G.topicRow;
      });
      y += h + G.blockGap;
    });
  });
  return { H, pos };
}

const curve = (x1, y1, x2, y2) => {
  const mx = (x1 + x2) / 2;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} C${mx.toFixed(1)} ${y1.toFixed(1)} ${mx.toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
};

// Long branch names wrap to two short lines
function textLines(label, max) {
  if (label.length <= max) return [label];
  const words = label.split(" ");
  let a = "";
  while (words.length && (a + " " + words[0]).trim().length <= max) a = (a + " " + words.shift()).trim();
  return [a, words.join(" ")];
}

function nodeSVG(n, p) {
  const dim = state.stars && !starredHere(n);
  const cls = ["mm-node", `is-l${p.level}`, n.ref && "is-ref", n.bridge && "is-bridge", n.id === state.sel && "is-sel", dim && "is-dim"].filter(Boolean).join(" ");
  const mid = p.y + p.h / 2;
  let ex = p.x + p.w - 8, extras = "";
  badgesFor(n.id).forEach((m) => {
    const bw = m.short.length * 5.4 + 10;
    ex -= bw;
    extras += `<g class="mm-badge" data-badge="${m.letter}" data-from="${n.id}"><rect x="${ex}" y="${mid - 7}" width="${bw}" height="14" rx="7"/><text x="${ex + bw / 2}" y="${mid + 3}" text-anchor="middle">${m.short}</text></g>`;
    ex -= 3;
  });
  // S2 prep shows as a small dot where the bridge starts; a star sits at the very end
  if (n.bridge && !nodeOf(n.parent)?.bridge) { ex -= 7; extras += `<circle class="mm-dot" cx="${ex}" cy="${mid}" r="3.2"/>`; ex -= 5; }
  if (n.star) { ex -= 12; extras += `<path class="mm-star" transform="translate(${ex} ${mid - 5.5}) scale(0.46)" d="${STAR}"/>`; }
  const lines = textLines(n.label, p.level === 1 ? 19 : 40);
  const ty = mid + (lines.length === 2 ? -2.5 : 3.8);
  const tip = `${n.name ?? n.label}${n.core ? `: ${n.core}` : ""}${n.star ? `\n★ ${n.star}` : ""}${n.bridge ? "\nS2 prep: a bridge from S1 toward S2" : ""}`;
  return `<g class="${cls}" data-id="${n.id}" tabindex="0" role="img" aria-label="${esc(`${n.label}${n.star ? ", starred" : ""}${n.bridge ? ", S2 prep" : ""}`)}"><title>${esc(tip)}</title>` +
    `<rect class="mm-box" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.level === 1 ? 8 : 6}"/>` +
    lines.map((l, i) => `<text class="mm-label" x="${p.x + 9}" y="${ty + i * 11.5}">${esc(l)}</text>`).join("") + extras + `</g>`;
}

function render() {
  const { H, pos } = layout();
  const cy = H / 2;
  let wires = "", nodes = "";
  map.root.forEach((b) => {
    const p = pos.get(b.id);
    const from = p.dir > 0 ? G.cx + G.centerW / 2 : G.cx - G.centerW / 2;
    wires += `<path class="mm-wire is-l1${state.stars && !starredHere(b) ? " is-dim" : ""}" d="${curve(from, cy, p.dir > 0 ? p.x : p.x + p.w, p.y + p.h / 2)}"/>`;
    nodes += nodeSVG(b, p);
    b.children.forEach((t) => {
      const q = pos.get(t.id);
      wires += `<path class="mm-wire${state.stars && !starredHere(t) ? " is-dim" : ""}" d="${curve(p.dir > 0 ? p.x + p.w : p.x, p.y + p.h / 2, q.dir > 0 ? q.x : q.x + q.w, q.y + q.h / 2)}"/>`;
      nodes += nodeSVG(t, q);
    });
  });
  const center = `<g class="mm-node is-center"><title>${esc(map.core)}</title>` +
    `<rect class="mm-box" x="${G.cx - G.centerW / 2}" y="${cy - G.centerH / 2}" width="${G.centerW}" height="${G.centerH}" rx="${G.centerH / 2}"/>` +
    `<text class="mm-label" x="${G.cx}" y="${cy + 5}" text-anchor="middle">${esc(meta.title)}</text></g>`;
  const svg = $("#mm-map");
  svg.setAttribute("viewBox", `0 0 ${G.W} ${H}`);
  svg.innerHTML = `<g>${wires}</g><g>${nodes}${center}</g>`;
}

function bind() {
  $("#mm-map").addEventListener("click", (e) => {
    const badge = e.target.closest(".mm-badge");
    if (!badge) return;
    // A badge opens the other map at the linked node (the first one when there are several)
    const target = linksFor(badge.dataset.from).find((l) => l.to[0] === badge.dataset.badge);
    if (target) location.assign(`/materials/${mapOfId(target.to).slug}/#${target.to}`);
  });
  $("#mm-stars").addEventListener("click", () => {
    state.stars = !state.stars;
    $("#mm-stars").setAttribute("aria-pressed", String(state.stars));
    render();
  });
  // Arriving from another map's badge: that node is marked
  addEventListener("hashchange", () => { state.sel = nodeOf(location.hash.slice(1)) ? location.hash.slice(1) : null; render(); });
}

await loadMaps();
document.title = `${meta.title} - Hub`;
$("#mt-title").textContent = meta.title;
if (!map) {
  $("#mt-sub").textContent = "Not written yet";
  $(".mm-actions").hidden = true;
  $("#mt-view").innerHTML = `<section class="card mm-empty"><h2 class="text-title-3 strong">${esc(meta.title)} isn't written yet</h2>
    <p class="text-subheadline text-secondary">Write public/materials/maps/${meta.file} in the same format as the Mathematics map, then set ready to true for it in materials/mindmap.js.</p>
    <a class="btn btn-gray btn-sm" href="/materials/${MAPS[0].slug}/">Open the Mathematics map</a></section>`;
} else {
  const topics = map.root.reduce((t, b) => t + b.children.length, 0);
  $("#mt-sub").textContent = `${map.root.length} branches · ${topics} topics`;
  const all = [...map.nodes.values()];
  if (!all.some((n) => n.bridge)) $(".mm-legend-dot").parentElement.hidden = true;
  if (!all.some((n) => badgesFor(n.id).length)) $(".mm-legend-badge").parentElement.hidden = true;
  if (!all.some((n) => n.ref)) $(".mm-legend-ref").parentElement.hidden = true;
  const problems = checkMap(map, maps);
  if (problems.length) console.warn(`[${meta.short} map] checklist:\n${problems.join("\n")}`);
  state.sel = nodeOf(location.hash.slice(1)) ? location.hash.slice(1) : null;
  bind();
  render();
}
