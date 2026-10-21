// One page for every subject (/materials/<slug>). Topics that already appear in an earlier subject
// are gray, so repeats are easy to spot; topics that come back later say where.
import { SUBJECTS } from "./data.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const key = (name) => name.trim().toLowerCase();
const ic = (name, cls = "icon-sm") => `<svg class="icon ${cls}" aria-hidden="true"><use href="/assets/icons/sprite.svg#${name}"></use></svg>`;

// Where every topic appears, in study order
const where = new Map();
SUBJECTS.forEach((s) => s.groups.forEach((g) => g.topics.forEach((t) => {
  const list = where.get(key(t)) ?? [];
  if (!list.includes(s)) list.push(s);
  where.set(key(t), list);
})));

const slug = location.pathname.replace(/\/+$/, "").split("/").pop();
const subject = SUBJECTS.find((s) => s.slug === slug) ?? SUBJECTS[0];
const state = { hideRepeats: false };

function topicRow(t) {
  const list = where.get(key(t));
  const first = list[0];
  const repeat = first !== subject;
  const others = list.filter((s) => s !== subject);
  const link = (s) => `<a href="/materials/${s.slug}">${esc(s.title)}</a>`;
  return `<li class="mt-topic${repeat ? " is-repeat" : ""}"${repeat && state.hideRepeats ? " hidden" : ""}>
    <span class="mt-dot" aria-hidden="true"></span><span class="mt-name">${esc(t)}</span>
    ${repeat || others.length ? `<span class="mt-note">${repeat ? ic("history") : ic("link")}${repeat ? `Covered in ${link(first)}` : `Also in ${others.map(link).join(", ")}`}</span>` : ""}
  </li>`;
}

function render() {
  const all = subject.groups.flatMap((g) => g.topics);
  const repeats = all.filter((t) => where.get(key(t))[0] !== subject).length;
  const shared = all.filter((t) => where.get(key(t)).length > 1 && where.get(key(t))[0] === subject).length;
  document.title = `${subject.title} - Hub`;
  $("#mt-title").textContent = subject.title;
  $("#mt-sub").textContent = `${all.length} topics · ${repeats} repeated from earlier subjects`;
  $("#mt-view").innerHTML = `
    <section class="card mt-hero">
      <span class="app-icon app-icon-lg" aria-hidden="true">${ic(subject.icon, "")}</span>
      <div><h2 class="text-title-3 strong">${esc(subject.title)}</h2><p class="text-subheadline text-secondary">${esc(subject.intro)}</p></div>
      <div class="mt-stats">
        <div><b>${all.length}</b><span>topics</span></div>
        <div><b>${all.length - repeats}</b><span>new here</span></div>
        <div class="is-repeat"><b>${repeats}</b><span>repeats</span></div>
        <div><b>${shared}</b><span>come back later</span></div>
      </div>
    </section>
    <div class="mt-bar">
      <span class="mt-legend"><span class="mt-dot" aria-hidden="true"></span>New in this subject</span>
      <span class="mt-legend is-repeat"><span class="mt-dot" aria-hidden="true"></span>Already in an earlier subject</span>
      <label class="mt-toggle"><input type="checkbox" id="mt-hide"${state.hideRepeats ? " checked" : ""}> Hide repeats</label>
    </div>
    <div class="mt-groups">${subject.groups.map((g) => {
      const fresh = g.topics.filter((t) => where.get(key(t))[0] === subject).length;
      return `<section class="card mt-group"><header class="mg-card-head"><h3>${esc(g.name)}</h3><p>${fresh} of ${g.topics.length} new</p></header>
        <ul class="mt-topics" role="list">${g.topics.map(topicRow).join("")}</ul></section>`;
    }).join("")}</div>`;
}

$("#mt-view").addEventListener("change", (e) => {
  if (e.target.id === "mt-hide") { state.hideRepeats = e.target.checked; render(); $("#mt-hide").focus(); }
});
render();
