// Hub is laptop-only. On phones and tablets (small screen, or touch without a mouse) every page is covered
// by a notice that can't be dismissed; device-gate.css hides the page itself, this adds the notice and
// makes the hidden page unreachable for keyboards and screen readers too.
const QUERY = matchMedia("screen and (width < 48rem), screen and (hover: none) and (pointer: coarse)");

function notice() {
  const gate = document.createElement("div");
  gate.className = "device-gate";
  gate.setAttribute("role", "alertdialog");
  gate.setAttribute("aria-modal", "true");
  gate.setAttribute("aria-labelledby", "gate-title");
  gate.setAttribute("aria-describedby", "gate-text");
  gate.innerHTML = `<div class="device-gate-box">
    <img class="brand-icon" src="/assets/img/app-icon.svg" alt="" width="64" height="64">
    <svg class="device-gate-art" viewBox="0 0 120 72" aria-hidden="true"><rect x="22" y="6" width="76" height="48" rx="5"/><path d="M8 62h104l-6 6H14z"/><rect x="31" y="15" width="58" height="30" rx="2" class="screen"/></svg>
    <h1 class="text-title-3 strong" id="gate-title">Open Hub on a laptop</h1>
    <p class="text-subheadline text-secondary" id="gate-text">Hub is made for a laptop or desktop screen with a keyboard and mouse. Phones and tablets aren't supported.</p>
  </div>`;
  return gate;
}

let gate = null;
function apply() {
  const blocked = QUERY.matches;
  [...document.body.children].forEach((el) => { if (el !== gate) el.inert = blocked; });
  if (blocked && !gate) { gate = notice(); document.body.append(gate); }
  if (gate) gate.hidden = !blocked;
}

apply();
QUERY.addEventListener("change", apply);
