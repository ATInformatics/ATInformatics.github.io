// Cinematic homepage DEMO v6 (2026-11-27). One continuous film, driven by the scroll from the first pixel.
// Positions are in screens (s = how many screen heights you scrolled into a scene). Each next scene starts
// under the one above; the top stage dissolves over 0.7 screen, so one picture melts into the next.
// hero+01: light plate -> dark plate, the moon rises and sets, the sun rises over the summer shop.
// 02: the shop closes, the sign, lights on, a phone in the middle: banner, then the conversation.
// 03: the bushes open onto the golden city, the dashboard assembles. Then "Let's talk" on his paper plate.
(function () {
  "use strict";
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var XFADE = 0.55;
  function clamp(x) { return Math.max(0, Math.min(1, x)); }
  function band(s, a, b) { return clamp((s - a) / (b - a)); }
  function ease(x) { return x * x * (3 - 2 * x); }
  function pop(x) { var c = 2.2; x = x - 1; return 1 + (c + 1) * x * x * x + c * x * x; }   // overshoots, then settles
  var web = document.getElementById("web"), ai = document.getElementById("ai"), big = document.getElementById("big"),
      talk = document.getElementById("talk");
  var scenes = [web, ai, big, talk];
  function stageOf(el) { return el.querySelector(".stage"); }

  // ---- 03: the bushes film on a canvas ----
  var film = { dir: big.dataset.frames, n: +big.dataset.count, imgs: [], loading: false, last: -1, canvas: big.querySelector("canvas") };
  film.ctx = film.canvas.getContext("2d");
  var SMACK_MS = 460, smackRaf = 0, filmAt = 0;
  function loadFilm() {
    if (film.loading) return; film.loading = true;
    for (var i = 0; i < film.n; i++) (function (i) {
      var im = new Image(); im.onload = function () { film.imgs[i] = im; if (!smackRaf) drawFilm(filmAt); };
      im.src = film.dir + "/" + String(i + 1).padStart(3, "0") + ".jpg";
    })(i);
  }
  function fit(c) {
    var r = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(c.clientWidth * r), h = Math.round(c.clientHeight * r);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; return true; }
    return false;
  }
  function drawFilm(i) {
    i = Math.max(0, Math.min(film.n - 1, i)); filmAt = i;
    var k = i; while (k > 0 && !film.imgs[k]) k--;
    var im = film.imgs[k], resized = fit(film.canvas);
    if (!im || (k === film.last && !resized)) return;
    var cw = film.canvas.width, ch = film.canvas.height, sc = Math.max(cw / im.width, ch / im.height);
    film.ctx.imageSmoothingQuality = "high";
    film.ctx.drawImage(im, (cw - im.width * sc) / 2, (ch - im.height * sc) / 2, im.width * sc, im.height * sc);
    film.last = k;
  }
  var city = big.querySelector(".goldcity");
  function smack() {                                       // one swift move through the bushes, a warm flash onto the city
    var t0 = performance.now(), from = filmAt;
    (function step(t) {
      var k = Math.min(1, (t - t0) / SMACK_MS);
      drawFilm(Math.round(from + k * k * (film.n - 1 - from)));
      if (k < 1) { smackRaf = requestAnimationFrame(step); return; }
      smackRaf = 0;
      var f = big.querySelector(".flash"); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go");
      city.style.opacity = 1;
    })(t0);
  }

  // ---- the top bar height and 01's arc (a circle through both side points and a higher point at the top) ----
  var dial = { ang: 30 };
  function layout() {
    var n = document.querySelector(".nav"), navh = n ? Math.round(n.getBoundingClientRect().height) : 72;
    root.style.setProperty("--navh", navh + "px");
    var W = window.innerWidth, H = window.innerHeight, phone = W < 760;
    var size = Math.max(74, Math.min(H * 0.12, W * 0.2, 150));
    var m = phone ? 84 : Math.max(140, W * 0.1);
    // at the top of the arc the whole moon (its picture is 1.7x as tall as wide, stick included) shows under the top bar
    var yt = navh + 18 + size * 1.7, y0 = yt + (phone ? 30 : 110);
    var c = W / 2 - m, s = y0 - yt, R = (c * c + s * s) / (2 * s);
    dial.ang = Math.asin(Math.min(1, c / R)) * 180 / Math.PI;
    web.style.setProperty("--W", size.toFixed(0) + "px");
    web.style.setProperty("--R", R.toFixed(0) + "px");
    web.style.setProperty("--py", (yt + R).toFixed(0) + "px");
    film.last = -1;
  }

  // ---- 01: gentle snow while it is night ----
  var snowC = web.querySelector(".snowfx"), snowX = snowC.getContext("2d"), flakes = [], snowA = 0, running = false;
  for (var f = 0; f < 320; f++) flakes.push({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7, ph: Math.random() * 6.28 });
  function snowLoop(t) {
    if (snowA <= 0) { running = false; snowX.clearRect(0, 0, snowC.width, snowC.height); return; }
    fit(snowC);
    var w = snowC.width, h = snowC.height, r = Math.min(window.devicePixelRatio || 1, 2);
    var count = window.innerWidth < 760 ? 140 : 320;
    snowX.clearRect(0, 0, w, h); snowX.fillStyle = "#fff";
    for (var i = 0; i < count; i++) {
      var p = flakes[i];
      p.y += 0.0016 * (0.5 + p.z); p.x += 0.0004 * p.z + Math.sin(t / 1300 + p.ph) * 0.0005;
      if (p.y > 1.02) { p.y = -0.02; p.x = Math.random(); }
      if (p.x > 1.02) p.x = -0.02;
      snowX.globalAlpha = (0.5 + 0.5 * p.z) * snowA;
      snowX.beginPath(); snowX.arc(p.x * w, p.y * h, (1 + p.z * 2.6) * r, 0, 6.283); snowX.fill();
    }
    snowX.globalAlpha = 1;
    requestAnimationFrame(snowLoop);
  }

  // ---- hero: glints twinkle on his light plate while it is light ----
  var tw = web.querySelector(".twinkle"), twX = tw.getContext("2d"), glints = [], twOn = false;
  for (var g0 = 0; g0 < 46; g0++) glints.push({ x: Math.random(), y: Math.random() * 0.85, s: 0.5 + Math.random(), ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.4 });
  function twLoop(t) {
    if (!twOn) { twX.clearRect(0, 0, tw.width, tw.height); tw.dataset.run = ""; return; }
    fit(tw);
    var w = tw.width, h = tw.height, k = w / 1600;
    twX.clearRect(0, 0, w, h);
    glints.forEach(function (p) {
      var a = Math.max(0, Math.sin(t / 1000 * p.sp + p.ph)); a = a * a * a;
      if (a < 0.02) return;
      var x = p.x * w, y = p.y * h, r = (4 + 7 * p.s) * k * a;
      var gr = twX.createRadialGradient(x, y, 0, x, y, r * 2.2);
      gr.addColorStop(0, "rgba(255,248,225," + a + ")"); gr.addColorStop(1, "rgba(255,220,150,0)");
      twX.fillStyle = gr; twX.beginPath(); twX.arc(x, y, r * 2.2, 0, 6.283); twX.fill();
      twX.strokeStyle = "rgba(255,250,235," + (a * 0.9) + ")"; twX.lineWidth = Math.max(1, k);
      twX.beginPath(); twX.moveTo(x - r * 2.4, y); twX.lineTo(x + r * 2.4, y); twX.moveTo(x, y - r * 2.4); twX.lineTo(x, y + r * 2.4); twX.stroke();
    });
    requestAnimationFrame(twLoop);
  }

  var webStage = stageOf(web), aiStage = stageOf(ai), talkStage = stageOf(talk);
  var heroIn = web.querySelector(".heroin"), puppets = [].slice.call(web.querySelectorAll(".puppet"));
  var vDark = web.querySelector(".hv.dark");
  var phone = ai.querySelector(".phone");
  var dash = big.querySelector(".dash"), tiles = [].slice.call(dash.querySelectorAll(".tile"));
  var gauge = dash.querySelector(".gauge"), chart = dash.querySelector(".chart"), src = dash.querySelector(".src");
  var counters = [].slice.call(dash.querySelectorAll("b[data-n]"));
  var thread = document.querySelector(".thread"), fill = thread && thread.querySelector(".thread-fill");
  var state = { open: false, lights: false };
  function play(v, on) { if (!v) return; if (on && v.paused) { var x = v.play(); if (x && x.catch) x.catch(function () {}); } else if (!on && !v.paused) v.pause(); }

  function frame() {
    var vh = window.innerHeight, y = window.scrollY;
    function S(el) { return still ? 9 : (y - el.offsetTop) / vh; }
    // every stage dissolves while the next scene starts under it
    scenes.forEach(function (el, i) {
      var nx = scenes[i + 1], st = stageOf(el);
      st.style.opacity = (!nx || still) ? 1 : (1 - ease(band(y, nx.offsetTop, nx.offsetTop + XFADE * vh))).toFixed(3);
      [].forEach.call(el.querySelectorAll("[data-from]"), function (c) {
        var s = S(el); c.classList.toggle("on", still || (s >= +c.dataset.from && s < +c.dataset.to));
      });
      [].forEach.call(el.querySelectorAll("[data-at]"), function (b) { b.classList.toggle("on", still || S(el) >= +b.dataset.at); });
    });

    // ---- hero + 01: dark at once, the moon up and down, the sun and the people up before the shop fills the screen ----
    var s = S(web), A = dial.ang + 32;
    var dk = still ? 1 : ease(band(s, 0, 0.4));
    webStage.style.setProperty("--dk", dk.toFixed(3));
    webStage.style.setProperty("--nt", (still ? 1 : ease(band(s, 0.2, 0.48))).toFixed(3));
    webStage.style.setProperty("--dy", (still ? 1 : ease(band(s, 0.3, 0.48))).toFixed(3));
    var ho = 1 - band(s, 0.03, 0.3);
    heroIn.style.opacity = ho.toFixed(3);
    heroIn.style.transform = "translateY(" + (-s * 45).toFixed(1) + "vh)";
    heroIn.style.pointerEvents = ho > 0.5 ? "auto" : "none";
    var am = -A + A * ease(band(s, 0, 0.26)) + A * ease(band(s, 0.24, 0.42));
    var as = -A + A * ease(band(s, 0.26, 0.46));
    web.style.setProperty("--am", am.toFixed(2) + "deg");
    web.style.setProperty("--as", as.toFixed(2) + "deg");
    web.style.setProperty("--arc", band(s, 0.05, 0.3).toFixed(3));
    web.classList.toggle("is-day", still || s >= 0.38);
    puppets.forEach(function (p) {
      if (p._d === undefined) p._d = parseFloat(p.style.getPropertyValue("--d")) || 0;
      var x = still ? 1 : band(s, 0.32 + p._d * 0.01, 0.44 + p._d * 0.01), u = x >= 1 ? 1 : pop(x);
      p.style.setProperty("--u", u.toFixed(3)); p.classList.toggle("up", x >= 1 && !still);
    });
    snowA = still ? 0 : band(s, 0.2, 0.34) * (1 - band(s, 0.38, 0.52));
    if (snowA > 0 && !running) { running = true; requestAnimationFrame(snowLoop); }
    twOn = !still && s < 0.45 && dk < 1;
    if (twOn && !tw.dataset.run) { tw.dataset.run = "1"; requestAnimationFrame(twLoop); }
    play(vDark, dk > 0 && s < 0.5 && !still);

    // ---- 02: shorter; the conversation and the owner's alert come early ----
    s = S(ai);
    aiStage.style.setProperty("--dy", (still ? 1 : 1 - ease(band(s, 0.3, 0.62))).toFixed(3));
    aiStage.style.setProperty("--sg", (still ? 1 : ease(band(s, 0.62, 0.84))).toFixed(3));
    var lights = still || s >= 0.88;
    if (lights !== state.lights) { state.lights = lights; ai.classList.toggle("lights", lights); }
    aiStage.style.setProperty("--bk", lights ? "0" : (0.75 * band(s, 0.62, 0.84)).toFixed(3));
    var up = ease(band(s, 1.16, 1.34)) * (1 - ease(band(s, 2.22, 2.42)));
    phone.style.setProperty("--y", (still ? 0 : (1 - up) * 120).toFixed(2));
    ai.classList.toggle("dim", up > 0 || s >= 2.4);
    ai.classList.toggle("opened", still || s >= 1.5);

    // ---- 03 ----
    s = S(big);
    var r = big.getBoundingClientRect();
    if (r.top < vh * 2.5 && r.bottom > -vh) loadFilm();
    var enter = band(s, 0, 0.75);
    film.canvas.style.transform = "scale(" + (1.16 - 0.16 * enter).toFixed(4) + ")";
    var opened = still || s >= 0.9;
    if (opened && !state.open) { state.open = true; if (still) city.style.opacity = 1; else smack(); }
    if (state.open && !opened) { state.open = false; cancelAnimationFrame(smackRaf); smackRaf = 0; city.style.opacity = 0; }
    if (!state.open && !smackRaf) drawFilm(Math.round(enter * 4));
    city.style.transform = "scale(" + (1.12 - 0.04 * band(s, 0.9, 3)).toFixed(4) + ")";
    // the dashboard: tiles come in one after the other, the needle and the line follow the scroll
    tiles.forEach(function (t, i) { t.style.setProperty("--k", (still ? 1 : ease(band(s, 1.66 + i * 0.07, 1.86 + i * 0.07))).toFixed(3)); });
    var g = still ? 1 : ease(band(s, 1.7, 2.1)), c = still ? 1 : ease(band(s, 1.95, 2.3));
    gauge.style.setProperty("--g", g.toFixed(3)); chart.style.setProperty("--c", c.toFixed(3)); src.style.setProperty("--c", c.toFixed(3));
    counters.forEach(function (b) {
      var v = Math.round(+b.dataset.n * (still ? 1 : ease(band(s, 1.7, 2.15))));
      b.textContent = v.toLocaleString("en-GB");
    });

    // ---- after 03: the ivory paper unfolds towards you ----
    s = S(talk);
    talkStage.style.setProperty("--f", (still ? 1 : ease(band(s, 0.3, 0.95))).toFixed(3));

    // ---- the thread: dots sit where each module really is ----
    if (thread) {
      var start = web.offsetTop, end = big.offsetTop + 2.6 * vh;
      thread.classList.toggle("on", y < talk.offsetTop + vh * 0.3);
      fill.style.height = (clamp((y - start) / (end - start)) * 100).toFixed(1) + "%";
      [[web, 0.4], [ai, 0.4], [big, 0.4]].forEach(function (d) {
        var at = d[0].offsetTop + d[1] * vh, dot = thread.querySelector("[data-t=" + d[0].id + "]");
        dot.style.top = (clamp((at - start) / (end - start)) * 100).toFixed(1) + "%";
        dot.classList.toggle("on", y >= at);
      });
    }
  }
  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; frame(); }); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { layout(); onScroll(); });
  layout();
  frame();
})();
