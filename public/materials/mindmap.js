// Reads a knowledge map written in markdown (rules: Aturan Peta Math, Stats, Data, dan AI v1.1) and checks it.
// Works in the browser and in Node, so the same checks run on the page and from the command line.

// The four maps, in menu (prerequisite) order. letter is the ID prefix; short is the badge text.
// Set ready to true once a map's file is written in materials/maps/.
export const MAPS = [
  { slug: "mathematics", letter: "M", short: "Math", title: "Mathematics", file: "peta-math.md", ready: true },
  { slug: "statistics", letter: "S", short: "Stats", title: "Statistics", file: "peta-stats.md", ready: false },
  { slug: "data", letter: "D", short: "Data", title: "Data", file: "peta-data.md", ready: false },
  { slug: "artificial-intelligence", letter: "A", short: "AI", title: "Artificial Intelligence", file: "peta-ai.md", ready: false },
];
export const mapOfId = (id) => MAPS.find((m) => m.letter === id?.[0]);

const NODE = /^(\s*)- ([MSDA]\d+(?:\.\d+){0,2}) (.+)$/;
const FIELD = /^\s*> ([a-z][a-z ]*?)(?: ([MSDA]\d+(?:\.\d+){0,2}))?: (.*)$/;
const SYSTEM = /^(.+?): (.+) #(\d+)$/;

/** Parses one map file into { letter, title, core, nodes: Map<id, node>, root: [branch nodes] } */
export function parseMap(text, letter) {
  const lines = text.replace(/<!--[\s\S]*?-->/g, "").split(/\r?\n/);
  const map = { letter, title: "", core: "", nodes: new Map(), root: [], lineOf: new Map() };
  let last = null;
  lines.forEach((line, i) => {
    if (/^# /.test(line)) { map.title = line.slice(2).trim(); return; }
    if (/^Inti: /.test(line)) { map.core = line.slice(6).trim(); return; }
    const n = line.match(NODE);
    if (n) {
      const id = n[2];
      const [label, ...cols] = n[3].split(" | ").map((s) => s.trim());
      const node = { id, label, depth: id.split(".").length, core: "", needs: [], ref: null, name: null, reasons: {}, seeAlso: [], systems: [], star: null, bridge: false, children: [], parent: null, line: i + 1 };
      cols.forEach((c) => {
        if (c.startsWith("butuh:")) node.needs.push(...c.slice(6).split(";").map((s) => s.trim()).filter(Boolean));
        else if (c.startsWith("rujukan:")) node.ref = c.slice(8).trim();
        else node.core = c;
      });
      const parentId = id.split(".").slice(0, -1).join(".");
      node.parent = parentId || null;
      if (map.nodes.has(id)) node.duplicate = true;
      map.nodes.set(id, node);
      if (node.parent) map.nodes.get(node.parent)?.children.push(node);
      else map.root.push(node);
      last = node;
      return;
    }
    const f = line.match(FIELD);
    if (f && last) {
      const [, key, ref, value] = f;
      if (key === "nama") last.name = value.trim();
      else if (key === "alasan" && ref) last.reasons[ref] = value.trim();
      else if (key === "lihat juga") last.seeAlso.push(...value.split(";").map((s) => s.trim()).filter(Boolean));
      else if (key === "bintang") last.star = value.trim();
      else if (key === "tingkat") last.bridge = value.trim() === "transisi";
      else if (key === "peta sistem") {
        value.split(";").map((s) => s.trim()).filter(Boolean).forEach((s) => {
          const m = s.match(SYSTEM);
          last.systems.push(m ? { map: m[1], area: m[2], number: Number(m[3]) } : { raw: s });
        });
      }
    }
  });
  // A bridge branch or topic makes everything under it a bridge too
  const inherit = (n, on) => { n.bridge = n.bridge || on; n.children.forEach((c) => inherit(c, n.bridge)); };
  map.root.forEach((b) => inherit(b, false));
  return map;
}

/** Links between maps, both ways. maps: { letter: parsed map }. Returns Map<id, [{ to, kind, reason }]> */
export function linksOf(maps) {
  const links = new Map();
  const add = (from, entry) => { if (!links.has(from)) links.set(from, []); links.get(from).push(entry); };
  Object.values(maps).forEach((m) => m.nodes.forEach((n) => {
    n.needs.forEach((to) => {
      add(n.id, { to, kind: "needs", reason: n.reasons[to] ?? "" });
      add(to, { to: n.id, kind: "basis", reason: n.reasons[to] ?? "" });
    });
    if (n.ref) {
      add(n.id, { to: n.ref, kind: "ref", reason: "" });
      add(n.ref, { to: n.id, kind: "referenced", reason: "" });
    }
  }));
  return links;
}

const wordsIn = (s) => s.replace(/[()]/g, " ").trim().split(/\s+/).filter(Boolean).length;

/** The checklist from section 8. Returns a list of problems; empty means the map is done. */
export function checkMap(map, maps = { [map.letter]: map }) {
  const out = [];
  const say = (n, msg) => out.push(`${n ? `${n.id} (line ${n.line})` : map.letter}: ${msg}`);
  const all = [...map.nodes.values()];
  all.forEach((n) => { if (n.duplicate) say(n, "ID is used twice"); });

  // Numbering: 1, 2, 3 … under every parent, with no gaps
  const seq = (list) => list.forEach((n, i) => { const last = Number(n.id.slice(1).split(".").pop()); if (last !== i + 1) say(n, `expected number ${i + 1} here`); });
  seq(map.root);
  all.forEach((n) => seq(n.children));

  // Sizes (section 3)
  if (map.root.length < 5 || map.root.length > 8) say(null, `${map.root.length} branches; rules ask for 5 to 8`);
  map.root.forEach((b) => { if (b.children.length < 3 || b.children.length > 7) say(b, `${b.children.length} topics; rules ask for 3 to 7`); });
  all.filter((n) => n.depth === 2).forEach((t) => { if (t.children.length > 5) say(t, `${t.children.length} subtopics; at most 5`); });

  all.forEach((n) => {
    if (wordsIn(n.label) > 4) say(n, `label has ${wordsIn(n.label)} words; at most 4`);
    if (!n.ref && !n.core) say(n, "missing the one-sentence core");
    if (n.ref && (n.children.length || n.core)) say(n, "a reference has no core and no children");
    if (n.ref && mapOfId(n.ref)?.letter === map.letter) say(n, "a reference must point to another map");
    n.seeAlso.forEach((id) => { if (!map.nodes.has(id)) say(n, `"lihat juga" ${id} isn't in this map`); });
    [...n.needs, ...(n.ref ? [n.ref] : [])].forEach((id) => {
      const target = maps[id[0]];
      if (id[0] === map.letter) say(n, `${id} is in the same map; use "lihat juga" instead`);
      else if (target && !target.nodes.has(id)) say(n, `${id} doesn't exist in the ${mapOfId(id).short} map`);
    });
  });

  // No loops: X needs Y and Y needs X
  const links = linksOf(maps);
  all.forEach((n) => n.needs.forEach((to) => {
    const back = maps[to[0]]?.nodes.get(to);
    if (back?.needs.includes(n.id)) say(n, `needs ${to}, and ${to} needs it back`);
  }));
  const linked = all.filter((n) => links.has(n.id)).length;
  if (linked > all.length / 3) say(null, `${linked} of ${all.length} nodes are linked to other maps; keep it near a third`);
  return out;
}
