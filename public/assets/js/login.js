const form = document.querySelector(".login-form");
const input = form.querySelector("#password");
const button = form.querySelector('[type="submit"]');
const error = document.getElementById("login-error");
const errorText = error.querySelector(".login-error-text");

// Return to the page the user came from, but only a path on this site (prevents open redirects)
function safeNext() {
  const next = new URLSearchParams(location.search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  return next;
}

function showError(message) {
  errorText.textContent = message;
  error.hidden = false;
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", "login-error");
  input.select();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.hidden = true;
  input.removeAttribute("aria-invalid");
  button.setAttribute("aria-busy", "true");

  try {
    const res = await fetch("/api/login", { method: "POST", body: new FormData(form) });
    if (res.ok) {
      location.assign(safeNext());
      return;
    }
    const data = await res.json().catch(() => ({}));
    showError(data.message ?? "Can't sign in. Try again.");
  } catch {
    showError("Connection lost. Check your internet and try again.");
  } finally {
    button.removeAttribute("aria-busy");
  }
});
