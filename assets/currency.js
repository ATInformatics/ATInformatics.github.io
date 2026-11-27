// Euro or pounds, picked automatically from the visitor's region (his call 2026-11-27: no switch).
// UK time zone, or a British English browser -> pounds; everyone else -> euro.
(function () {
  var root = document.documentElement;
  var UK = ["Europe/London", "Europe/Belfast", "Europe/Jersey", "Europe/Guernsey", "Europe/Isle_of_Man"];
  function region() {
    var tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    if (UK.indexOf(tz) >= 0) return "gbp";
    var langs = navigator.languages || [navigator.language || ""];
    return String(langs[0] || "").toLowerCase() === "en-gb" ? "gbp" : "eur";
  }
  var c = region();
  root.classList.toggle("gbp", c === "gbp");
  // one price in the text: euro by default, the pound figure kept in data-gbp (build.py one_currency)
  var ps = document.querySelectorAll(".cur[data-gbp]");
  for (var j = 0; j < ps.length; j++) {
    var p = ps[j];
    if (p.dataset.eur === undefined) p.dataset.eur = p.innerHTML;
    p.innerHTML = c === "gbp" ? p.dataset.gbp : p.dataset.eur;
  }
})();
