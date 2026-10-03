/* cv-lang.js -- EN/BG (Cyrillic) toggle for the unlisted CV.
 *
 * Same-origin, which keeps the CSP at script-src 'self' with no third-party
 * request. It reads nothing, stores nothing beyond a single language choice in
 * localStorage, sends nothing.
 *
 * It swaps textContent in place rather than showing a second copy of the page,
 * so reveal.js's revealed state (the .rv.in class) is preserved across a
 * language change. English is the default; БГ is opt-in.
 */
(function () {
  "use strict";
  var bar = document.querySelector(".cv-langbar");
  if (!bar) return;
  var nodes = document.querySelectorAll("[data-bg]");

  function set(lang) {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n.hasAttribute("data-en")) n.setAttribute("data-en", n.textContent);
      n.textContent = n.getAttribute(lang === "bg" ? "data-bg" : "data-en");
    }
    document.documentElement.lang = lang;
    var btns = bar.querySelectorAll("button[data-lang]");
    for (var j = 0; j < btns.length; j++) {
      btns[j].setAttribute("aria-pressed",
        btns[j].getAttribute("data-lang") === lang ? "true" : "false");
    }
    try { localStorage.setItem("cv-lang", lang); } catch (e) {}
  }

  bar.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button[data-lang]") : null;
    if (b) set(b.getAttribute("data-lang"));
  });

  var saved = null;
  try { saved = localStorage.getItem("cv-lang"); } catch (e) {}
  if (saved === "bg") set("bg");
})();
