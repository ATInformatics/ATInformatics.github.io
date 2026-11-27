// Euro or pounds. Picks automatically (UK time zone or en-GB browser -> pounds),
// and the visitor can switch. The choice is kept only in this browser.
(function () {
  var root = document.documentElement, KEY = "ati-cur";
  function guess() {
    try { var s = localStorage.getItem(KEY); if (s === "gbp" || s === "eur") return s; } catch (e) {}
    var tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    if (tz === "Europe/London" || tz === "Europe/Belfast") return "gbp";
    var langs = navigator.languages || [navigator.language || ""];
    return String(langs[0] || "").toLowerCase() === "en-gb" ? "gbp" : "eur";
  }
  function apply(c) {
    root.classList.toggle("gbp", c === "gbp");
    // one price in the text: euro by default, the pound figure kept in data-gbp (build.py one_currency)
    var ps = document.querySelectorAll(".cur[data-gbp]");
    for (var j = 0; j < ps.length; j++) {
      var p = ps[j];
      if (p.dataset.eur === undefined) p.dataset.eur = p.innerHTML;
      p.innerHTML = c === "gbp" ? p.dataset.gbp : p.dataset.eur;
    }
    var bs = document.querySelectorAll(".curswitch button");
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", bs[i].getAttribute("data-cur") === c ? "true" : "false");
  }
  apply(guess());
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".curswitch button");
    if (!b) return;
    var c = b.getAttribute("data-cur");
    try { localStorage.setItem(KEY, c); } catch (e2) {}
    apply(c);
  });
})();
