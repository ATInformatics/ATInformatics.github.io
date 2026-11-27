/* reveal.js -- the only script the site ships.
 *
 * Same-origin, which is what lets the CSP stay script-src 'self' with no
 * third-party request anywhere. It reads nothing, stores nothing, sends
 * nothing.
 *
 * It fades sections in as they enter. It does NOT scale, zoom, pin or scrub:
 * an earlier build drove the page scale from scroll position and the founder
 * reported vertigo and wanting to leave. See assets/site.css's header.
 */
(function () {
  "use strict";
  var els = document.querySelectorAll(".rv");
  if (!els.length) return;

  // Reduced motion gets everything visible immediately, never a blank page.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)) {
    for (var i = 0; i < els.length; i++) els[i].classList.add("in");
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  els.forEach(function (el, i) {
    el.style.transitionDelay = (i % 3) * 90 + "ms";
    io.observe(el);
  });
})();

/* One track at a time.
   Native <audio controls> elements do not know about each other: clicking
   play on a second track leaves the first one playing and you hear both.
   'play' does not bubble, so this listens in the CAPTURE phase on document,
   which is the only way one handler can see every player on the page. */
(function () {
  document.addEventListener("play", function (e) {
    var started = e.target;
    if (!started || started.tagName !== "AUDIO") return;
    var all = document.querySelectorAll("audio");
    for (var i = 0; i < all.length; i++) {
      if (all[i] !== started && !all[i].paused) all[i].pause();
    }
  }, true);
})();

// The side menu on phones (2026-11-27): the ☰ button opens it; a tap outside, a link or Escape closes it.
(function () {
  var nav = document.querySelector(".nav"), btn = nav && nav.querySelector(".navtoggle"), shade = document.querySelector(".navshade");
  if (!btn) return;
  function set(open) {
    nav.classList.toggle("open", open); btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (shade) shade.hidden = !open; document.documentElement.style.overflow = open ? "hidden" : "";
  }
  btn.addEventListener("click", function () { set(!nav.classList.contains("open")); });
  if (shade) shade.addEventListener("click", function () { set(false); });
  nav.querySelectorAll(".navpanel a").forEach(function (a) { a.addEventListener("click", function () { set(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
})();
