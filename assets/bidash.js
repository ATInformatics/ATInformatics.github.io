// Business Intelligence Dashboard, sample. Three made-up local businesses; the wheel spins to the
// source you pick. Light by default, night is optional and kept only in this browser.
(function () {
  var ROOT = document.querySelector(".bid");
  if (!ROOT) return;
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var COL = ["peach", "lilac", "mint", "butter"];

  var B = {
    bakery: { icon: "🥐", tab: "Bakery", name: "Rosie's Bakery", visits: 4548, vd: "18% more than last month", money: 1510,
      steps: [4548, 222, 24, 11, 9, 5], spark: [28, 24, 26, 18, 20, 12, 14, 7, 4],
      src: [["Google", 19, 4, 1190], ["Facebook", 4, 1, 320], ["Typed your address", 1, 0, 0]],
      days: [38, 95, 58, 44, 70, 52, 18], chats: [61, 3, 17, "4s"],
      tip: ["None of your 5 new customers has ordered again yet.", "A short thank-you a week after the first order could change that."] },
    plumber: { icon: "🔧", tab: "Plumber", name: "Rapid Flow Plumbing", visits: 1320, vd: "9% more than last month", money: 3940,
      steps: [1320, 96, 41, 30, 24, 17], spark: [26, 27, 22, 23, 16, 18, 11, 12, 8],
      src: [["Google", 22, 9, 2100], ["A friend told them", 11, 6, 1440], ["Facebook", 5, 2, 400], ["Typed your address", 3, 0, 0]],
      days: [92, 64, 55, 60, 48, 30, 22], chats: [88, 9, 34, "3s"],
      tip: ["Recommendations bring your best jobs: 6 of 11 became paying customers.", "Ask every happy customer for a Google review the same day."] },
    salon: { icon: "✂️", tab: "Hair salon", name: "Bloom Hair Studio", visits: 2210, vd: "12% more than last month", money: 1710,
      steps: [2210, 140, 63, 52, 45, 38], spark: [24, 22, 25, 18, 17, 14, 15, 9, 6],
      src: [["Instagram", 31, 20, 900], ["Google", 22, 13, 610], ["Walked past", 10, 5, 200]],
      days: [20, 35, 48, 52, 80, 96, 12], chats: [143, 6, 51, "5s"],
      tip: ["12 of your 38 clients have not booked again in 6 weeks.", "A friendly reminder message could bring them back."] }
  };
  var KEY = "ati-dash";
  var st = { biz: "bakery", sel: 0, rot: 0 };
  try { var saved = JSON.parse(localStorage.getItem(KEY) || "{}"); if (saved.theme === "dark") ROOT.setAttribute("data-theme", "dark"); } catch (e) {}

  function money(v) { var s = v.toLocaleString("en-GB"); return '<span class="c-eur">€' + s + '</span><span class="c-gbp">£' + s + "</span>"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function spark(pts, c) {
    var d = pts.map(function (y, i) { return (i ? "L" : "M") + (i * 120 / (pts.length - 1)).toFixed(1) + " " + y; }).join(" ");
    return '<svg viewBox="0 0 120 34" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '" fill="none" stroke="var(--' + c + '-i)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function arc(a0, a1, r0, r1) {
    function p(a, r) { return [50 + r * Math.sin(a), 50 - r * Math.cos(a)]; }
    var big = a1 - a0 > Math.PI ? 1 : 0, A = p(a0, r1), Bp = p(a1, r1), C = p(a1, r0), D = p(a0, r0);
    return "M" + A + "A" + r1 + " " + r1 + " 0 " + big + " 1 " + Bp + "L" + C + "A" + r0 + " " + r0 + " 0 " + big + " 0 " + D + "Z";
  }
  function slices(b) {
    var tot = b.src.reduce(function (a, s) { return a + s[1]; }, 0), a = 0;
    return b.src.map(function (s, i) { var w = s[1] / tot * Math.PI * 2, out = { i: i, a0: a, a1: a + w, mid: a + w / 2 }; a += w; return out; });
  }

  function render() {
    var b = B[st.biz], asked = b.steps[2], paid = b.steps[5], sl = slices(b);
    var dayN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], hi = b.days.indexOf(Math.max.apply(null, b.days));
    var max = b.steps[0];
    ROOT.innerHTML =
      '<span class="bid-ribbon" aria-hidden="true">SAMPLE</span>' +
      '<div class="bid-top"><h4 class="bid-hello">Good morning, ' + esc(b.name) + '<small>Made-up numbers for a sample business. Your own dashboard looks like this.</small></h4>' +
      '<div class="bid-pick" role="group" aria-label="Sample business">' + Object.keys(B).map(function (k) {
        return '<button type="button" data-biz="' + k + '" aria-pressed="' + (k === st.biz) + '"><span aria-hidden="true">' + B[k].icon + "</span>" + B[k].tab + "</button>"; }).join("") + "</div>" +
      '<button type="button" class="bid-night" aria-pressed="' + (ROOT.getAttribute("data-theme") === "dark") + '"><i aria-hidden="true">' + (ROOT.getAttribute("data-theme") === "dark" ? "☀" : "☾") + "</i>" + (ROOT.getAttribute("data-theme") === "dark" ? "Day" : "Night") + "</button></div>" +
      '<div class="bid-grid">' +
      kpi("k1", "People who visited", b.visits.toLocaleString("en-GB"), "▲ " + b.vd, "peach", b.spark) +
      kpi("k2", "Asked you something", asked, "by chat, form or phone", "lilac", b.spark.map(function (y) { return Math.min(32, y + 3); })) +
      kpi("k3", "New customers", paid, Math.round(paid / asked * 100) + "% of those who asked", "mint", b.spark.map(function (y) { return Math.min(32, y + 6); })) +
      kpi("k4", "Money in", money(b.money), "from these " + paid + " customers", "butter", b.spark.map(function (y, i) { return i % 2 ? y + 2 : y; })) +
      '<div class="bid-card bid-wheelcard"><div><h5>Where your customers came from</h5><div class="bid-wheel"><span class="pin" aria-hidden="true"></span>' +
      '<svg class="disc" viewBox="0 0 100 100" style="transform:rotate(' + st.rot + 'deg)">' + sl.map(function (s) {
        return '<path d="' + arc(s.a0, s.a1, 0, 48) + '" fill="var(--' + COL[s.i % 4] + ')" data-slice="' + s.i + '"><title>' + esc(b.src[s.i][0]) + "</title></path>" +
          '<path d="' + arc(s.a0, s.a1, 40, 48) + '" fill="var(--' + COL[s.i % 4] + '-i)" opacity=".85" data-slice="' + s.i + '"/>'; }).join("") +
      '</svg><div class="hub"><div><b>' + asked + "</b><small>asked this month</small></div></div></div></div>" +
      '<div class="bid-slice" aria-live="polite"></div></div>' +
      '<div class="bid-card bid-steps"><h5>From a visit to a customer</h5>' + [["Visited", 0, "peach"], ["Clicked call or form", 1, "peach"], ["Asked you", 2, "lilac"], ["Good fit", 3, "lilac"], ["Booked", 4, "mint"], ["Paid you", 5, "mint"]].map(function (r, k) {
        var w = 9 + 91 * Math.log(b.steps[r[1]]) / Math.log(max);
        return '<div class="bid-step">' + r[0] + '<div class="bar"><b style="width:' + w.toFixed(0) + "%;background:var(--" + r[2] + "-i);opacity:" + (k % 2 ? .7 : 1) + '"></b></div><span class="v">' + b.steps[r[1]].toLocaleString("en-GB") + "</span></div>"; }).join("") +
      '<p class="bid-note">Bars are not to scale, so the small steps stay visible. <b>' + Math.round(paid / b.steps[3] * 100) + "% of good fits became customers.</b></p></div>" +
      '<div class="bid-card bid-third"><h5>Your busiest days</h5><div class="bid-days">' + b.days.map(function (v, i) {
        return '<div class="' + (i === hi ? "hi" : "") + '"><span style="height:' + v + '%"></span>' + dayN[i] + "</div>"; }).join("") + '</div><p class="bid-note"><b>' + ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][hi] + "</b> is when people ask the most.</p></div>" +
      '<div class="bid-card bid-third"><h5>Your assistant this month</h5><div class="bid-assist">' +
      [[b.chats[0], "chats answered"], [b.chats[1], "handed to you"], [b.chats[2], "after closing time"], [b.chats[3], "to reply"]].map(function (x) { return "<div><b>" + x[0] + "</b><small>" + x[1] + "</small></div>"; }).join("") + "</div></div>" +
      '<div class="bid-card bid-third bid-tip"><h5>One thing to try</h5><span class="tag">Biggest chance</span><p>' + esc(b.tip[0]) + "</p><small>" + esc(b.tip[1]) + " A suggestion from the numbers. You decide.</small></div>" +
      '<details class="bid-card bid-more"><summary>Show the numbers behind this <span>for people who like the detail</span></summary><div class="bid-tbl"><table><thead><tr><th>Where they came from (first visit)</th><th class="r">Asked</th><th class="r">Paid</th><th class="r">Paid rate</th><th class="r">Money in</th></tr></thead><tbody>' +
      b.src.map(function (s) { return "<tr><td>" + esc(s[0]) + '</td><td class="r">' + s[1] + '</td><td class="r">' + s[2] + '</td><td class="r">' + (s[1] >= 5 ? Math.round(s[2] / s[1] * 100) + "%" : "too few") + '</td><td class="r">' + (s[3] ? money(s[3]) : "0") + "</td></tr>"; }).join("") +
      "</tbody></table><p>Every number follows the same " + asked + " enquiries from first visit to payment. A rate shows only when a group has 5 or more enquiries. Money is the gross amount paid, tax included, not profit. Phone calls show as \"not connected\" until the phone line is linked.</p></div></details></div>";
    pick(st.sel, false);
  }
  function kpi(cls, h, n, d, c, pts) {
    return '<div class="bid-card bid-kpi ' + cls + '"><span class="blob" aria-hidden="true"></span><h5>' + h + '</h5><div class="n">' + n + '</div><div class="d">' + d + "</div>" + spark(pts, c) + "</div>";
  }
  function pick(i, spin) {
    var b = B[st.biz], s = slices(b)[i], src = b.src[i];
    st.sel = i;
    var target = -s.mid * 180 / Math.PI;
    if (spin) { var delta = ((st.rot - target) % 360 + 360) % 360; st.rot = st.rot - delta - (still ? 0 : 720); }
    else st.rot = target;
    var disc = ROOT.querySelector(".disc");
    if (disc) disc.style.transform = "rotate(" + st.rot + "deg)";
    ROOT.querySelector(".bid-slice").innerHTML =
      '<h4><i style="background:var(--' + COL[i % 4] + '-i)"></i>' + esc(src[0]) + "</h4><dl><dt>Asked</dt><dd>" + src[1] + "</dd><dt>Became customers</dt><dd>" + src[2] +
      "</dd><dt>Money in</dt><dd>" + (src[3] ? money(src[3]) : "none yet") + "</dd></dl><p>Tap a colour on the wheel, or spin it.</p>" +
      '<button type="button" class="bid-spin">Spin the wheel</button>';
  }

  ROOT.addEventListener("click", function (e) {
    var t = e.target.closest("[data-biz],[data-slice],.bid-spin,.bid-night");
    if (!t) return;
    if (t.hasAttribute("data-biz")) { st.biz = t.getAttribute("data-biz"); st.sel = 0; render(); }
    else if (t.hasAttribute("data-slice")) pick(+t.getAttribute("data-slice"), true);
    else if (t.classList.contains("bid-spin")) pick((st.sel + 1) % B[st.biz].src.length, true);
    else {
      var d = ROOT.getAttribute("data-theme") === "dark" ? "light" : "dark";
      ROOT.setAttribute("data-theme", d);
      try { localStorage.setItem(KEY, JSON.stringify({ theme: d })); } catch (e2) {}
      render();
    }
  });
  render();
  // one spin when the dashboard first comes into view
  if (!still && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(function () { pick(st.sel, true); }, 300); } }, { threshold: .35 });
    io.observe(ROOT);
  }
})();
