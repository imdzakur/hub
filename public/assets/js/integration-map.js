// Integration map renderer shared by every map page (systems/finance, systems/finance-self).
// Tabs per area, an SVG map of system groups, a detail panel below it,
// step-by-step routes, and search across every system and protocol.
import { ICONS } from "./map-icons.js";

const DASH = { rt: "none", bt: "5 4", ev: "1.5 4" };
const PLAY_INTERVAL = 1900;

// Set by initIntegrationMap
let DOMAINS, TABS, PROTO, MODE, MODE_HINT, STORAGE_KEY, byId;

const state = { dom: null, sel: null, hover: null, hotEdge: null, route: null, step: 0, timer: null, modes: { rt: true, bt: true, ev: true }, flash: null, proto: null };
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function ic(name, cls = "icon-sm") {
  return `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
}

function colorOf(n, d = state.dom) {
  if (n.ext) return "gray";
  return TABS[n.link || n.id]?.color ?? TABS[d.id].color;
}

function appIcon(name, color, size = "") {
  return `<span class="app-icon ${size}" data-color="${color}" aria-hidden="true">${ic(name, "")}</span>`;
}

function buildSprite() {
  $("#fm-sprite").innerHTML = "<defs>" + Object.entries(ICONS).map(([k, v]) =>
    `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join("") + "</defs>";
}

const countSys = (d) => d.nodes.reduce((t, n) => t + (n.sys ? n.sys.length : 0), 0);

/* ---------- layout ---------- */
function curve(a, b) {
  const f = (v) => v.toFixed(1);
  if (a.side === "l" || a.side === "r") {
    return { d: `M${f(a.x)} ${f(a.y)} L${f(b.x)} ${f(b.y)}`, mid: [(a.x + b.x) / 2, (a.y + b.y) / 2] };
  }
  let c1, c2;
  if (a.side === "b" && b.side === "t") {
    const dy = Math.max(18, (b.y - a.y) * 0.5); c1 = [a.x, a.y + dy]; c2 = [b.x, b.y - dy];
  } else if (a.side === "t" && b.side === "b") {
    const dy = Math.max(18, (a.y - b.y) * 0.5); c1 = [a.x, a.y - dy]; c2 = [b.x, b.y + dy];
  } else {
    const dir = a.side === "t" ? -1 : 1;
    const h = 16 + Math.min(16, Math.abs(a.x - b.x) * 0.03);
    c1 = [a.x, a.y + dir * h]; c2 = [b.x, b.y + dir * h];
  }
  return {
    d: `M${f(a.x)} ${f(a.y)} C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(b.x)} ${f(b.y)}`,
    mid: [(a.x + 3 * c1[0] + 3 * c2[0] + b.x) / 8, (a.y + 3 * c1[1] + 3 * c2[1] + b.y) / 8],
  };
}

function prep(d) {
  if (d._prep) return;
  d._nodes = Object.fromEntries(d.nodes.map((n) => [n.id, n]));
  // Compact grid: short tiles, tight rows; the map scales to the card width
  const W = 1100, mx = 10, rowH = 64, top = 16, nh = 30;
  const rows = {};
  d.nodes.forEach((n) => { (rows[n.row] ??= []).push(n); });
  const keys = Object.keys(rows).map(Number).sort((a, b) => a - b);
  keys.forEach((r, ri) => {
    const L = rows[r];
    const slot = (W - 2 * mx) / L.length;
    const w = Math.min(168, slot - 16);
    L.forEach((n, i) => {
      Object.assign(n, { _w: w, _h: nh, _cx: mx + slot * (i + 0.5), _y: top + ri * rowH, _ri: ri, _ci: i });
      n._x = n._cx - w / 2;
    });
  });
  d._W = W;
  d._H = top + (keys.length - 1) * rowH + nh + 16;
  const slots = {};
  d.edges.forEach((e, i) => {
    e._i = i;
    const a = d._nodes[e.f], b = d._nodes[e.t];
    let sa, sb;
    if (a._ri < b._ri) { sa = "b"; sb = "t"; }
    else if (a._ri > b._ri) { sa = "t"; sb = "b"; }
    else if (Math.abs(a._ci - b._ci) === 1) { sa = a._ci < b._ci ? "r" : "l"; sb = sa === "r" ? "l" : "r"; }
    else { sa = sb = a._ri === 0 ? "b" : "t"; }
    (slots[`${a.id}|${sa}`] ??= []).push({ e, end: "a", ox: b._cx });
    (slots[`${b.id}|${sb}`] ??= []).push({ e, end: "b", ox: a._cx });
  });
  Object.entries(slots).forEach(([k, list]) => {
    const [id, side] = k.split("|");
    const n = d._nodes[id];
    list.sort((p, q) => p.ox - q.ox);
    const c = list.length;
    list.forEach((s, j) => {
      if (side === "l" || side === "r") {
        const x = side === "r" ? n._x + n._w : n._x;
        const y = n._y + n._h / 2 + (c === 1 ? 0 : (j - (c - 1) / 2) * 6);
        s.e[`_${s.end}`] = { x, y, side };
        return;
      }
      const x = c === 1 ? n._cx : n._x + n._w * (0.18 + 0.64 * (j / (c - 1)));
      const y = side === "t" ? n._y : n._y + n._h;
      s.e[`_${s.end}`] = { x, y, side };
    });
  });
  // Pull both ends a little away from the tiles so arrowheads sit in clear space
  const GAP = 3;
  const OUT = { t: [0, -1], b: [0, 1], l: [-1, 0], r: [1, 0] };
  d.edges.forEach((e) => {
    [e._a, e._b].forEach((end) => { const [dx, dy] = OUT[end.side]; end.x += dx * GAP; end.y += dy * GAP; });
    const c = curve(e._a, e._b);
    e._d = c.d; e._mid = c.mid;
  });
  d._prep = true;
}

function wrap(text, max) {
  const lines = [];
  let cur = "";
  text.split(" ").forEach((w) => {
    const t = cur ? `${cur} ${w}` : w;
    if (t.length > max && cur) { lines.push(cur); cur = w; } else cur = t;
  });
  if (cur) lines.push(cur);
  if (lines.length > 3) {
    const rest = lines.slice(2).join(" ");
    lines.length = 2;
    lines.push(rest.length > max ? `${rest.slice(0, max - 1)}…` : rest);
  }
  return lines;
}

function nodeSVG(n) {
  // Tiny tile: 16px icon chip, 10px label, number in the corner
  const chip = 16, pad = 7;
  const textX = n._x + pad + chip + 6;
  const room = n._w - (textX - n._x) - (n.num ? 14 : 6);
  let lines = wrap(n.label, Math.max(8, Math.floor(room / 5.3)));
  let small = false;
  if (lines.length > 2) { lines = wrap(n.label, Math.max(8, Math.floor(room / 4.8))); small = true; }
  const mid = n._y + n._h / 2;
  const step = small ? 8.5 : 10;
  const text = lines.map((ln, i) => {
    const y = mid + 3.5 + (i - (lines.length - 1) / 2) * step;
    return `<text class="nl${small ? " sm" : ""}" x="${textX.toFixed(1)}" y="${y.toFixed(1)}">${esc(ln)}</text>`;
  }).join("");
  const chipY = mid - chip / 2;
  return `<g class="node${n.ext ? " ext" : ""}" data-n="${n.id}" data-color="${colorOf(n)}" tabindex="0" role="button" aria-label="${esc(n.label + (n.ext ? ", outside party" : ""))}">` +
    `<rect class="nb" x="${n._x.toFixed(1)}" y="${n._y}" width="${n._w.toFixed(1)}" height="${n._h}" rx="7"/>` +
    `<rect class="chip-bg" x="${(n._x + pad).toFixed(1)}" y="${chipY}" width="${chip}" height="${chip}" rx="${(chip * 0.2237).toFixed(1)}"/>` +
    `<use class="ico" href="#i-${n.icon}" x="${(n._x + pad + 3).toFixed(1)}" y="${chipY + 3}" width="10" height="10"/>` +
    (n.num ? `<text class="nt" x="${(n._x + n._w - 5).toFixed(1)}" y="${n._y + 9}" text-anchor="end">${n.num}</text>` : "") +
    text + "</g>";
}

// A slim dart with a notched back and rounded corners; the line ends inside the notch, so it meets the head cleanly
function marker(id, cls, size) {
  return `<marker id="${id}" viewBox="0 0 12 12" refX="9.5" refY="6" markerUnits="userSpaceOnUse" markerWidth="${size}" markerHeight="${size}" orient="auto-start-reverse"><path class="mk ${cls}" d="M2.2 2.4L10.4 6L2.2 9.6L4.4 6Z"/></marker>`;
}

const findEdge = (d, f, t) => d.edges.find((e) => (e.f === f && e.t === t) || (e.f === t && e.t === f));

function drawMap() {
  const d = state.dom;
  prep(d);
  const svg = $("#fm-map");
  svg.setAttribute("viewBox", `0 0 ${d._W} ${d._H}`);
  svg.setAttribute("aria-label", `${d.name} integration map`);
  const E = d.edges.map((e) => `<path class="edge m-${e.m}" data-e="${e._i}" d="${e._d}" marker-end="url(#ah)"/>`).join("");
  const H = d.edges.map((e) => `<path class="ehit" data-e="${e._i}" d="${e._d}"/>`).join("");
  const N = d.nodes.map(nodeSVG).join("");
  svg.innerHTML = `<defs>${marker("ah", "mk-idle", 8)}${marker("ah-on", "mk-on", 9.5)}${marker("ah-r", "mk-r", 11)}${marker("ah-rp", "mk-rp", 10)}</defs>` +
    `<g id="fm-edges">${E}</g><g>${H}</g><g>${N}</g><g id="fm-over"></g>`;
}

function elabel(e, cls, withProto) {
  const [x, y] = e._mid;
  const txt = withProto ? `${e.l} (${e.p})` : e.l;
  return `<text class="elabel${cls ? ` ${cls}` : ""}" x="${x.toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle">${esc(txt)}</text>`;
}

function stepBadge(e, i, now) {
  const [x, y] = e._mid;
  return `<g class="step-badge${now ? " now" : ""}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7"/><text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="middle">${i + 1}</text></g>`;
}

/* ---------- paint map state ---------- */
function paint() {
  const d = state.dom;
  const svg = $("#fm-map");
  const edges = [];
  svg.querySelectorAll(".edge").forEach((el) => { edges[Number(el.dataset.e)] = el; });
  const hits = [...svg.querySelectorAll(".ehit")];
  const nodes = [...svg.querySelectorAll(".node")];
  let over = "";
  edges.forEach((el, i) => {
    const on = state.modes[d.edges[i].m];
    el.setAttribute("class", `edge m-${d.edges[i].m}${on ? "" : " off"}`);
    el.setAttribute("marker-end", "url(#ah)");
    el.removeAttribute("marker-start");
    hits[i].setAttribute("class", `ehit${on ? "" : " off"}`);
  });
  nodes.forEach((el) => el.setAttribute("class", `node${d._nodes[el.dataset.n].ext ? " ext" : ""}`));

  if (state.route) {
    const steps = state.route.steps, cur = state.step;
    const used = new Set();
    steps.forEach((s, i) => {
      if (i > cur) return;
      const e = findEdge(d, s.f, s.t);
      if (!e) return;
      const el = edges[e._i];
      el.classList.remove("off");
      const rev = e.f !== s.f;
      if (i === cur) {
        el.classList.remove("r-past");
        el.classList.add("r-now");
        el.classList.toggle("rev", rev);
        if (rev) { el.setAttribute("marker-end", "none"); el.setAttribute("marker-start", "url(#ah-r)"); }
        else { el.removeAttribute("marker-start"); el.setAttribute("marker-end", "url(#ah-r)"); }
      } else if (!el.classList.contains("r-now")) {
        el.classList.add("r-past");
        if (rev) { el.setAttribute("marker-end", "none"); el.setAttribute("marker-start", "url(#ah-rp)"); }
        else el.setAttribute("marker-end", "url(#ah-rp)");
      }
      used.add(s.f); used.add(s.t);
    });
    edges.forEach((el) => { if (!el.classList.contains("r-now") && !el.classList.contains("r-past")) el.classList.add("dim"); });
    const cs = steps[cur];
    nodes.forEach((el) => {
      const id = el.dataset.n;
      el.classList.add(id === cs.f || id === cs.t ? "r-now" : used.has(id) ? "r-node" : "dim");
    });
    steps.forEach((s, i) => {
      if (i >= cur) return;
      const e = findEdge(d, s.f, s.t);
      if (e) over += stepBadge(e, i, false);
    });
    const ce = findEdge(d, cs.f, cs.t);
    if (ce) over += stepBadge(ce, cur, true);
  } else if (state.proto) {
    const conn = new Set();
    const list = [];
    d.edges.forEach((e) => {
      const el = edges[e._i];
      if (e.p === state.proto) {
        el.classList.remove("off"); el.classList.add("on"); el.setAttribute("marker-end", "url(#ah-on)");
        conn.add(e.f); conn.add(e.t); list.push(e);
      } else el.classList.add("dim");
    });
    nodes.forEach((el) => el.classList.add(conn.has(el.dataset.n) ? "on" : "dim"));
    if (state.hotEdge != null) over += hot(edges, d.edges[state.hotEdge]);
    else if (list.length <= 8) list.forEach((e) => { over += elabel(e); });
  } else {
    const focus = state.sel || state.hover;
    if (focus) {
      const conn = new Set([focus]);
      const list = [];
      d.edges.forEach((e) => {
        const el = edges[e._i];
        if ((e.f === focus || e.t === focus) && state.modes[e.m]) {
          el.classList.add("on"); el.setAttribute("marker-end", "url(#ah-on)");
          conn.add(e.f); conn.add(e.t); list.push(e);
        } else el.classList.add("dim");
      });
      nodes.forEach((el) => {
        const id = el.dataset.n;
        el.classList.add(id === focus ? "sel" : conn.has(id) ? "on" : "dim");
      });
      if (list.length <= 5 && state.hotEdge == null) list.forEach((e) => { over += elabel(e); });
    }
    if (state.hotEdge != null) {
      const e = d.edges[state.hotEdge];
      over += hot(edges, e);
      nodes.forEach((n) => { if (n.dataset.n === e.f || n.dataset.n === e.t) n.classList.remove("dim"); });
    }
  }
  $("#fm-over").innerHTML = over;
  // Highlighted lines are drawn last, so dimmed lines never cross over them
  const group = $("#fm-edges");
  edges.forEach((el) => { if (/\b(on|hot|r-now|r-past)\b/.test(el.getAttribute("class"))) group.append(el); });
}

function hot(edges, e) {
  const el = edges[e._i];
  el.classList.remove("dim", "on", "off");
  el.classList.add("hot");
  el.setAttribute("marker-end", "url(#ah-r)");
  return elabel(e, "hot", true);
}

/* ---------- panel ---------- */
function head(iconName, color, kind, title) {
  return `<header class="fm-head">${appIcon(iconName, color, "app-icon-lg")}<div><p class="text-footnote text-secondary">${esc(kind)}</p><h2 class="text-title-3 strong" tabindex="-1">${esc(title)}</h2></div></header>`;
}

function back(label, act = "data-back") {
  return `<button type="button" class="btn btn-plain btn-sm fm-back" ${act}>${ic("back")}${esc(label)}</button>`;
}

function section(title, count, body) {
  return `<section class="list-section"><h3 class="list-header">${esc(title)}${count != null ? ` <span class="fm-count">${count}</span>` : ""}</h3>${body}</section>`;
}

function rowButton(attrs, iconHTML, title, sub, trailing = "") {
  return `<li><button type="button" class="list-row" ${attrs}>${iconHTML}<span class="fm-row-text"><span class="fm-row-title">${title}</span>${sub ? `<span class="fm-row-sub">${sub}</span>` : ""}</span>${trailing}</button></li>`;
}

function groupList(d) {
  const own = d.nodes.filter((n) => !n.ext).sort((a, b) => (a.num || 0) - (b.num || 0));
  const ext = d.nodes.filter((n) => n.ext);
  const row = (n) => {
    const cnt = n.sys ? n.sys.length : n.link ? countSys(byId[n.link]) : 0;
    return rowButton(`data-goto="${n.id}"`, appIcon(n.icon, colorOf(n, d), "app-icon-sm"),
      `${n.num ? `<span class="fm-num">${n.num}</span>` : ""}${esc(n.label)}`, "",
      cnt ? `<span class="list-value text-footnote">${cnt}</span>` : "");
  };
  let h = section(d === DOMAINS[0] ? "Areas" : "Groups", own.length, `<ul class="list list-has-icons" role="list">${own.map(row).join("")}</ul>`);
  if (ext.length) h += section("Outside parties", ext.length, `<ul class="list list-has-icons" role="list">${ext.map(row).join("")}</ul>`);
  return h;
}

function protoList(d) {
  const cnt = {};
  d.edges.forEach((e) => { cnt[e.p] = (cnt[e.p] || 0) + 1; });
  const keys = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || a.localeCompare(b));
  return section("Protocols", keys.length, `<ul class="list" role="list">${keys.map((k) =>
    rowButton(`data-proto="${esc(k)}"`, "", esc(k), "", `<span class="list-value text-footnote">${cnt[k]}</span>`)).join("")}</ul>`);
}

// One compact line: what flows, then protocol; the line style on the right shows the kind
function connRow(e, other, d, label) {
  return rowButton(`data-goto="${other.id}" data-edge="${e._i}"${state.modes[e.m] ? "" : ' data-muted'}`,
    appIcon(other.icon, colorOf(other, d), "app-icon-sm"),
    label ?? esc(other.label),
    `${esc(e.l)} · ${esc(e.p)}`,
    `<svg class="fm-swatch" aria-label="${MODE[e.m]}" role="img"><title>${esc(MODE_HINT[e.m])}</title><path d="M1 4H23" stroke-dasharray="${DASH[e.m]}"/></svg>`);
}

function overviewPanel(d) {
  const own = d.nodes.filter((n) => !n.ext).length;
  const isTop = d === DOMAINS[0];
  const stat = (n, one, many = `${one}s`) => `<div class="fm-stat"><b>${n.toLocaleString("en-US")}</b><span>${n === 1 ? one : many}</span></div>`;
  const stats = [
    isTop ? stat(own, "area") : stat(own, "group"),
    stat(isTop ? DOMAINS.reduce((t, x) => t + countSys(x), 0) : countSys(d), "system"),
    stat(d.nodes.filter((n) => n.ext).length, "outside party", "outside parties"),
    stat(new Set(d.edges.map((e) => e.p)).size, "protocol"),
  ].join("");
  return `<div class="fm-overview-head">${head(TABS[d.id].icon, TABS[d.id].color, isTop ? "All areas" : "Area", d.name)}<div class="fm-stats">${stats}</div></div>` +
    `<p class="text-subheadline text-secondary fm-intro">${esc(d.intro)}</p>` + groupList(d) + protoList(d);
}

function nodePanel(n) {
  const d = state.dom;
  const kind = n.ext ? "Outside party" : n.num ? `Group ${n.num}` : "Area";
  let h = back("All groups") + head(n.icon, colorOf(n), kind, n.label);
  h += `<p class="text-subheadline text-secondary">${esc(n.desc || "")}</p>`;
  if (n.link) h += `<button type="button" class="btn btn-filled" data-tab="${n.link}">Open ${esc(byId[n.link].name)}</button>`;
  const outs = d.edges.filter((e) => e.f === n.id);
  const ins = d.edges.filter((e) => e.t === n.id);
  if (outs.length) h += section("Sends to", outs.length, `<ul class="list list-has-icons" role="list">${outs.map((e) => connRow(e, d._nodes[e.t], d)).join("")}</ul>`);
  if (ins.length) h += section("Receives from", ins.length, `<ul class="list list-has-icons" role="list">${ins.map((e) => connRow(e, d._nodes[e.f], d)).join("")}</ul>`);
  if (n.sys) {
    h += section("Systems", n.sys.length, `<ol class="list" role="list">${n.sys.map((s, i) => {
      const no = n.start + i;
      return `<li><div class="list-row" data-no="${no}"><span class="fm-num">${no}</span><span class="list-title">${esc(s)}</span></div></li>`;
    }).join("")}</ol>`);
  } else if (n.link) {
    const ld = byId[n.link];
    const groups = ld.nodes.filter((x) => !x.ext).sort((a, b) => a.num - b.num);
    h += section("Groups in this area", groups.length, `<ul class="list list-has-icons" role="list">${groups.map((x) =>
      `<li><div class="list-row">${appIcon(x.icon, TABS[ld.id].color, "app-icon-sm")}<span class="list-title"><span class="fm-num">${x.num}</span>${esc(x.label)}</span><span class="list-value text-footnote">${x.sys.length}</span></div></li>`).join("")}</ul>`);
  }
  return h;
}

function protoPanel(d) {
  const k = state.proto;
  const list = d.edges.filter((e) => e.p === k);
  let h = back("Overview") + head("code", "gray", "Protocol", k);
  h += `<p class="text-subheadline text-secondary">${esc(PROTO[k] || "")}</p>`;
  h += section(`Used in ${d.name}`, list.length, `<ul class="list list-has-icons" role="list">${list.map((e) => {
    const a = d._nodes[e.f], b = d._nodes[e.t];
    return connRow(e, a, d, `${esc(a.label)} → ${esc(b.label)}`);
  }).join("")}</ul>`);
  const elsewhere = DOMAINS.filter((x) => x !== d && x.edges.some((e) => e.p === k));
  if (elsewhere.length) {
    h += section("Also used in", null, `<div class="cluster">${elsewhere.map((x) =>
      `<button type="button" class="chip" data-proto-tab="${x.id}">${esc(x.name)}</button>`).join("")}</div>`);
  }
  return h;
}

function routePanel() {
  const d = state.dom, r = state.route;
  let h = back("Exit route", 'data-act="exit"') + head("route", "orange", "Route", r.name);
  h += `<div class="fm-route-controls">` +
    `<button type="button" class="icon-btn" data-act="prev" aria-label="Previous step">${ic("prev", "icon-md")}</button>` +
    `<button type="button" class="btn btn-filled btn-sm" data-act="play"><span class="play-ic">${ic("play")}</span><span class="play-txt">Play</span></button>` +
    `<button type="button" class="icon-btn" data-act="next" aria-label="Next step">${ic("next", "icon-md")}</button>` +
    `<span class="fm-route-progress" id="fm-progress"></span></div>`;
  h += `<progress class="progress" id="fm-bar" max="${r.steps.length}" value="1"></progress>`;
  h += `<ol class="list fm-steps" role="list">${r.steps.map((s, i) => {
    const a = d._nodes[s.f], b = d._nodes[s.t];
    const e = findEdge(d, s.f, s.t);
    return `<li><button type="button" class="list-row fm-step" data-step="${i}"><span class="fm-step-num">${i + 1}</span>` +
      `<span class="fm-row-text"><span class="fm-row-title">${esc(s.x)}</span><span class="fm-row-sub">${esc(a.label)} → ${esc(b.label)}${e ? ` · ${esc(e.p)}` : ""}</span></span></button></li>`;
  }).join("")}</ol>`;
  return h;
}

function renderPanel({ focus = false } = {}) {
  const d = state.dom;
  const p = $("#fm-panel");
  p.innerHTML = state.route ? routePanel() : state.sel ? nodePanel(d._nodes[state.sel]) : state.proto ? protoPanel(d) : overviewPanel(d);
  p.dataset.view = state.route || state.sel || state.proto ? "detail" : "overview";
  p.querySelectorAll("[data-muted]").forEach((el) => el.classList.add("is-muted"));
  p.scrollTop = 0;
  if (state.route) syncRoute();
  if (state.flash != null) {
    const row = p.querySelector(`[data-no="${state.flash}"]`);
    if (row) {
      row.classList.add("is-flash");
      setTimeout(() => row.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" }), 80);
    }
    state.flash = null;
  }
  if (focus) p.querySelector("h2")?.focus({ preventScroll: true });
}

function syncRoute() {
  const p = $("#fm-panel");
  const n = state.route.steps.length;
  p.querySelectorAll(".fm-step").forEach((b) => {
    const i = Number(b.dataset.step);
    b.classList.remove("is-done", "is-now", "is-todo");
    b.classList.add(i < state.step ? "is-done" : i === state.step ? "is-now" : "is-todo");
    if (i === state.step) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
  });
  p.querySelector('[data-act="prev"]').disabled = state.step === 0;
  p.querySelector('[data-act="next"]').disabled = state.step === n - 1;
  const play = p.querySelector('[data-act="play"]');
  const playing = Boolean(state.timer);
  play.querySelector(".play-ic").innerHTML = ic(playing ? "pause" : "play");
  play.querySelector(".play-txt").textContent = playing ? "Pause" : state.step === n - 1 ? "Replay" : "Play";
  $("#fm-progress").textContent = `Step ${state.step + 1} of ${n}`;
  $("#fm-bar").value = state.step + 1;
  const now = p.querySelector(".fm-step.is-now");
  if (now && p.scrollHeight > p.clientHeight + 4) now.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
}

/* ---------- controls ---------- */
function renderRoutes() {
  const d = state.dom;
  $("#fm-routes").innerHTML = `<span class="fm-group-label">${ic("route")}Routes</span>` +
    d.routes.map((r, i) => `<button type="button" class="chip" data-route="${i}" aria-pressed="${state.route === r}">${esc(r.name)}</button>`).join("");
}

function renderModes() {
  $("#fm-modes").innerHTML = ["rt", "bt", "ev"].map((m) =>
    `<button type="button" class="chip" data-mode="${m}" aria-pressed="${state.modes[m]}" title="${esc(MODE_HINT[m])}"><svg class="fm-swatch" aria-hidden="true"><path d="M1 4H23" stroke-dasharray="${DASH[m]}"/></svg>${MODE[m]}</button>`).join("");
}

/* ---------- actions ---------- */
function stopTimer() {
  if (state.timer) { clearInterval(state.timer); state.timer = null; }
}

function reset(extra) {
  stopTimer();
  Object.assign(state, { sel: null, route: null, hover: null, hotEdge: null, proto: null }, extra);
  paint(); renderPanel({ focus: Boolean(extra && (extra.sel || extra.route || extra.proto)) }); renderRoutes();
}

const select = (id) => reset({ sel: id });

const clearSel = () => reset();
const setProto = (k) => reset({ proto: k });
const startRoute = (i) => reset({ route: state.dom.routes[i], step: 0 });

function goStep(i) {
  state.step = Math.max(0, Math.min(state.route.steps.length - 1, i));
  paint(); syncRoute();
}

function togglePlay() {
  if (state.timer) { stopTimer(); syncRoute(); return; }
  const n = state.route.steps.length;
  if (state.step === n - 1) { state.step = 0; paint(); }
  state.timer = setInterval(() => {
    if (state.step < n - 1) { state.step++; paint(); syncRoute(); }
    if (state.step >= n - 1) { stopTimer(); syncRoute(); }
  }, PLAY_INTERVAL);
  syncRoute();
}

function switchTab(id, focusTab) {
  stopTimer();
  state.dom = byId[id];
  Object.assign(state, { sel: null, route: null, hover: null, hotEdge: null, step: 0, proto: null });
  document.querySelectorAll("#fm-tabs .tab").forEach((b) => {
    const on = b.dataset.tab === id;
    b.setAttribute("aria-selected", String(on));
    b.tabIndex = on ? 0 : -1;
    if (on && focusTab) b.focus();
  });
  drawMap(); paint(); renderPanel(); renderRoutes();
  try { localStorage.setItem(STORAGE_KEY, id); } catch { /* private mode */ }
}

function buildTabs() {
  const nav = $("#fm-tabs");
  nav.innerHTML = DOMAINS.map((d) => {
    const cnt = d === DOMAINS[0] ? "" : `<span class="tab-count">${countSys(d)}</span>`;
    return `<button type="button" class="tab" role="tab" data-tab="${d.id}" aria-selected="false" aria-controls="fm-panel" tabindex="-1" title="${esc(d.name)}">${appIcon(TABS[d.id].icon, TABS[d.id].color, "app-icon-plain")}<span class="tab-label">${esc(d.name)}</span>${cnt}</button>`;
  }).join("");
  nav.addEventListener("click", (ev) => {
    const b = ev.target.closest(".tab");
    if (b) switchTab(b.dataset.tab);
  });
  nav.addEventListener("keydown", (ev) => {
    const ids = DOMAINS.map((d) => d.id);
    const i = ids.indexOf(state.dom.id);
    const j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ids.length - 1 }[ev.key];
    if (j === undefined) return;
    ev.preventDefault();
    switchTab(ids[(j + ids.length) % ids.length], true);
  });
}

/* ---------- search ---------- */
const INDEX = [];
function buildIndex() {
  Object.keys(PROTO).forEach((k) => INDEX.push({ kind: "proto", name: k, sub: "Protocol", hay: `${k} ${PROTO[k]}`.toLowerCase(), icon: "code", color: "gray" }));
  DOMAINS.forEach((d) => {
    if (d === DOMAINS[0]) return;
    d.nodes.forEach((n) => {
      if (n.ext) return;
      const color = TABS[d.id].color;
      INDEX.push({ kind: "group", dom: d.id, node: n.id, name: n.label, sub: `Group ${n.num} · ${d.name}`, hay: `${n.label} ${n.desc || ""}`.toLowerCase(), icon: n.icon, color });
      n.sys.forEach((s, i) => {
        INDEX.push({ kind: "sys", dom: d.id, node: n.id, no: n.start + i, name: s, sub: `${n.label} · ${d.name}`, hay: s.toLowerCase(), icon: n.icon, color });
      });
    });
  });
}

let results = [], activeIdx = -1;
function setExpanded(open) {
  $("#fm-results").hidden = !open;
  $("#fm-search").setAttribute("aria-expanded", String(open));
}

function runSearch(q) {
  const box = $("#fm-results");
  const query = q.trim().toLowerCase();
  if (query.length < 2) { results = []; setExpanded(false); return; }
  results = INDEX.map((it) => {
    const nm = it.name.toLowerCase();
    const score = nm.startsWith(query) ? 3 : nm.includes(query) ? 2 : it.hay.includes(query) ? 1 : 0;
    return { it, score };
  }).filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (a.it.kind === "group" ? -1 : 1))
    .slice(0, 14).map((x) => x.it);
  activeIdx = -1;
  box.innerHTML = results.length
    ? results.map((it, i) => `<button type="button" class="fm-result" role="option" id="fm-res-${i}" data-i="${i}">` +
      `${appIcon(it.icon, it.color, "app-icon-sm")}<span class="fm-result-text"><span class="fm-result-name">${it.kind === "sys" ? `<span class="fm-num">${it.no}</span>` : ""}${esc(it.name)}</span>` +
      `<span class="fm-result-sub">${esc(it.sub)}</span></span></button>`).join("")
    : `<p class="fm-results-empty">No results for “${esc(q.trim())}”.</p>`;
  setExpanded(true);
}

function pickResult(i) {
  const it = results[i];
  if (!it) return;
  setExpanded(false);
  $("#fm-search").value = "";
  if (it.kind === "proto") {
    let target = state.dom;
    if (!target.edges.some((e) => e.p === it.name)) target = DOMAINS.find((x) => x.edges.some((e) => e.p === it.name)) || target;
    if (target !== state.dom) switchTab(target.id);
    setProto(it.name);
    return;
  }
  if (state.dom.id !== it.dom) switchTab(it.dom);
  if (it.kind === "sys") state.flash = it.no;
  select(it.node, { quiet: true });
  $("#fm-map").scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
}

function bindSearch() {
  const input = $("#fm-search");
  const box = $("#fm-results");
  input.addEventListener("input", () => runSearch(input.value));
  input.addEventListener("focus", () => { if (input.value.trim().length >= 2) runSearch(input.value); });
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") { setExpanded(false); return; }
    if (!results.length) return;
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      activeIdx = (activeIdx + (ev.key === "ArrowDown" ? 1 : -1) + results.length) % results.length;
      box.querySelectorAll(".fm-result").forEach((b, i) => b.classList.toggle("is-active", i === activeIdx));
      const a = box.querySelector(".fm-result.is-active");
      if (a) { a.scrollIntoView({ block: "nearest" }); input.setAttribute("aria-activedescendant", a.id); }
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      pickResult(activeIdx >= 0 ? activeIdx : 0);
    }
  });
  box.addEventListener("click", (ev) => {
    const b = ev.target.closest(".fm-result");
    if (b) pickResult(Number(b.dataset.i));
  });
  $(".search-clear").addEventListener("click", () => {
    input.value = "";
    setExpanded(false);
    input.focus();
  });
  document.addEventListener("click", (ev) => { if (!ev.target.closest(".fm-search")) setExpanded(false); });
}

/* ---------- bindings ---------- */
function bind() {
  const svg = $("#fm-map");
  svg.addEventListener("click", (ev) => {
    const g = ev.target.closest(".node");
    if (g) select(g.dataset.n);
    else if (state.sel || state.proto) clearSel();
  });
  svg.addEventListener("keydown", (ev) => {
    const g = ev.target.closest(".node");
    if (g && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); select(g.dataset.n); }
  });
  svg.addEventListener("mouseover", (ev) => {
    if (state.route) return;
    const g = ev.target.closest(".node");
    const h = ev.target.closest(".ehit");
    if (g && !state.sel && !state.proto && state.hover !== g.dataset.n) { state.hover = g.dataset.n; paint(); }
    else if (h && state.hotEdge !== Number(h.dataset.e)) { state.hotEdge = Number(h.dataset.e); paint(); }
  });
  svg.addEventListener("mouseout", (ev) => {
    if (state.route) return;
    const g = ev.target.closest(".node");
    const h = ev.target.closest(".ehit");
    const to = ev.relatedTarget;
    if (g && !(to && g.contains(to)) && state.hover) { state.hover = null; paint(); }
    if (h && state.hotEdge != null) { state.hotEdge = null; paint(); }
  });

  const panel = $("#fm-panel");
  panel.addEventListener("click", (ev) => {
    const t = ev.target.closest("button");
    if (!t) return;
    if (t.hasAttribute("data-back")) clearSel();
    else if (t.dataset.proto) setProto(t.dataset.proto);
    else if (t.dataset.protoTab) { const k = state.proto; switchTab(t.dataset.protoTab); setProto(k); }
    else if (t.dataset.tab) switchTab(t.dataset.tab);
    else if (t.dataset.goto) select(t.dataset.goto, { quiet: true });
    else if (t.dataset.step != null) { stopTimer(); goStep(Number(t.dataset.step)); }
    else if (t.dataset.act === "prev") { stopTimer(); goStep(state.step - 1); }
    else if (t.dataset.act === "next") { stopTimer(); goStep(state.step + 1); }
    else if (t.dataset.act === "play") togglePlay();
    else if (t.dataset.act === "exit") clearSel();
  });
  const hoverEdge = (ev, on) => {
    const c = ev.target.closest("[data-edge]");
    if (!c) return;
    if (on && state.hotEdge !== Number(c.dataset.edge)) { state.hotEdge = Number(c.dataset.edge); paint(); }
    if (!on && !(ev.relatedTarget && c.contains(ev.relatedTarget)) && state.hotEdge != null) { state.hotEdge = null; paint(); }
  };
  panel.addEventListener("mouseover", (ev) => hoverEdge(ev, true));
  panel.addEventListener("mouseout", (ev) => hoverEdge(ev, false));
  panel.addEventListener("focusin", (ev) => hoverEdge(ev, true));
  panel.addEventListener("focusout", (ev) => hoverEdge(ev, false));

  $("#fm-routes").addEventListener("click", (ev) => {
    const b = ev.target.closest(".chip");
    if (!b) return;
    const i = Number(b.dataset.route);
    if (state.route === state.dom.routes[i]) clearSel(); else startRoute(i);
  });

  $("#fm-modes").addEventListener("click", (ev) => {
    const b = ev.target.closest(".chip");
    if (!b) return;
    const m = b.dataset.mode;
    // At least one kind stays visible
    if (state.modes[m] && Object.values(state.modes).filter(Boolean).length === 1) return;
    state.modes[m] = !state.modes[m];
    renderModes(); paint();
    if (state.sel) renderPanel();
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !ev.target.closest(".fm-search") && !document.querySelector("dialog[open]") && (state.sel || state.route || state.proto)) clearSel();
    if (ev.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) { ev.preventDefault(); $("#fm-search").focus(); }
  });
}

/**
 * @param {object} config
 * @param {Array} config.domains  map data; the first domain is the overview
 * @param {object} config.tabs     domain id -> { icon, color }
 * @param {object} config.protocols protocol name -> one-line description
 * @param {object} config.modes    { rt, bt, ev } labels
 * @param {object} config.modeHints { rt, bt, ev } tooltips
 * @param {string} config.storageKey localStorage key for the last open tab
 */
export function initIntegrationMap(config) {
  ({ domains: DOMAINS, tabs: TABS, protocols: PROTO, modes: MODE, modeHints: MODE_HINT, storageKey: STORAGE_KEY } = config);
  byId = Object.fromEntries(DOMAINS.map((d) => [d.id, d]));
  buildSprite();
  const total = DOMAINS.reduce((t, d) => t + countSys(d), 0);
  $("#fm-total").textContent = `${total.toLocaleString("en-US")} systems · ${DOMAINS.length - 1} areas`;
  buildTabs();
  buildIndex();
  renderModes();
  bind();
  bindSearch();
  let start = DOMAINS[0].id;
  try { const s = localStorage.getItem(STORAGE_KEY); if (s && byId[s]) start = s; } catch { /* private mode */ }
  switchTab(start);
}
