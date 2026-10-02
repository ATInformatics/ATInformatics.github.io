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
