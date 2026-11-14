/* counter.js -- cookieless page/click counter + contact form for atinformatics.com (2026-11-14).
   External file because the site's CSP allows only same-origin scripts. No cookie, no storage,
   no visitor id: one beacon per page view and per Call/email/WhatsApp/form click, with aggregate
   traffic dimensions. The contact form posts to the VM, which validates it server-side; only an
   accepted submission becomes a lead. Config: <script src="counter.js" data-endpoint data-site>. */
(function () {
  var me = document.currentScript, ep = (me && me.getAttribute("data-endpoint") || "").replace(/\/$/, ""),
      site = me && me.getAttribute("data-site");
  if (!ep || !site) return;
  var q = new URLSearchParams(location.search), ref = "";
  try { ref = document.referrer ? new URL(document.referrer).hostname : ""; } catch (_) {}
  if (ref === location.hostname) ref = "";
  var dims = {
    src: q.get("utm_source") || ref || "direct", med: q.get("utm_medium") || (ref ? "referral" : ""),
    cmp: q.get("utm_campaign") || "", lp: location.pathname, lang: (navigator.language || "").slice(0, 2),
    dev: matchMedia("(max-width:768px)").matches ? "mobile" : "desktop"
  };
  function hit(e) {
    var b = "site=" + site + "&e=" + e;
    for (var k in dims) b += "&" + k + "=" + encodeURIComponent(dims[k]);
    try { navigator.sendBeacon(ep + "/hit", b); } catch (_) {}
  }
  hit("view");
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a"); if (!a) return;
    var h = (a.getAttribute("href") || "").toLowerCase();
    var e = h.indexOf("tel:") === 0 ? "call" : h.indexOf("mailto:") === 0 ? "email" : /wa\.me|whatsapp|viber/.test(h) ? "whatsapp" : "";
    if (e) hit(e);
  }, true);

  var form = document.getElementById("atiForm");
  if (!form) return;
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var out = form.querySelector(".formmsg"), btn = form.querySelector("button");
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = String(v); });
    data.consent = !!form.querySelector("[name=consent]:checked");
    data.source = dims.src; data.medium = dims.med; data.campaign = dims.cmp; data.landing_page = dims.lp;
    data.language = dims.lang; data.device = dims.dev;
    btn.disabled = true; out.textContent = "Sending...";
    hit("form");
    fetch(ep + "/form/" + site, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().then(function (j) { return [r.status, j]; }); })
      .then(function (x) {
        if (x[0] === 202) { form.reset(); out.textContent = "Thank you. Your message reached a person. We reply within one working day."; }
        else { out.textContent = (x[1] && x[1].error) || "That did not send. Please email info@atinformatics.com."; }
      })
      .catch(function () { out.textContent = "That did not send. Please email info@atinformatics.com."; })
      .then(function () { btn.disabled = false; });
  });
})();
