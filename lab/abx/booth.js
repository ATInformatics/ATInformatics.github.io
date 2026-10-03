
"use strict";
const ctx = new (window.AudioContext || window.webkitAudioContext)();
const decks = { A: null, B: null };
let abxMode = false, trials = [], current = null, source = null, gainNode = null;

/* ── loudness, ITU-R BS.1770 ────────────────────────────────────────────────
   The two-stage K-weighting filter, then gated block loudness. This is the
   part that makes the comparison honest: without it the louder file wins on
   every single trial and the test measures nothing but level.              */
function kWeight(buf) {
  const sr = buf.sampleRate, n = buf.length;
  const off = new OfflineAudioContext(buf.numberOfChannels, n, sr);
  const src = off.createBufferSource(); src.buffer = buf;
  // stage 1: high-shelf, +4 dB above ~1.5 kHz (the "head" filter)
  const shelf = off.createBiquadFilter();
  shelf.type = "highshelf"; shelf.frequency.value = 1500; shelf.gain.value = 4;
  // stage 2: high-pass at ~38 Hz (RLB weighting)
  const hp = off.createBiquadFilter();
  hp.type = "highpass"; hp.frequency.value = 38; hp.Q.value = 0.5;
  src.connect(shelf).connect(hp).connect(off.destination);
  src.start();
  return off.startRendering();
}

// BS.1770 channel weights. Stereo is 1.0/1.0; anything beyond is approximated.
function channelWeight(i, total) {
  if (total <= 2) return 1.0;
  return i === 2 ? 1.0 : (i > 2 ? 1.41 : 1.0);
}

async function integratedLUFS(buf) {
  const w = await kWeight(buf);
  const sr = w.sampleRate;
  const block = Math.round(0.400 * sr);      // 400 ms
  const hop = Math.round(block * 0.25);      // 75 % overlap
  const chans = [];
  for (let c = 0; c < w.numberOfChannels; c++) chans.push(w.getChannelData(c));

  const blocks = [];
  for (let s = 0; s + block <= w.length; s += hop) {
    let sum = 0;
    for (let c = 0; c < chans.length; c++) {
      const d = chans[c]; let acc = 0;
      for (let i = s; i < s + block; i++) acc += d[i] * d[i];
      sum += channelWeight(c, chans.length) * (acc / block);
    }
    blocks.push(-0.691 + 10 * Math.log10(sum + 1e-12));
  }
  if (!blocks.length) return -70;

  // absolute gate at -70 LUFS, then relative gate at -10 LU below the mean
  const absolute = blocks.filter(l => l > -70);
  if (!absolute.length) return -70;
  const meanOf = ls => {
    let p = 0;
    for (const l of ls) p += Math.pow(10, (l + 0.691) / 10);
    return -0.691 + 10 * Math.log10(p / ls.length + 1e-12);
  };
  const relative = meanOf(absolute) - 10;
  const gated = absolute.filter(l => l > relative);
  return meanOf(gated.length ? gated : absolute);
}

function truePeakish(buf) {
  let peak = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; }
  }
  return 20 * Math.log10(peak + 1e-12);
}

/* ── loading ─────────────────────────────────────────────────────────────── */
async function load(side, file) {
  const slot = document.getElementById("slot" + side);
  slot.classList.add("full");
  slot.innerHTML = '<p class="tag mono">Deck ' + side + '</p><h3>' + esc(file.name) +
                   '</h3><p class="meta">measuring loudness…</p>';
  const buf = await ctx.decodeAudioData(await file.arrayBuffer());
  const lufs = await integratedLUFS(buf);
  const peak = truePeakish(buf);
  decks[side] = { file, buf, lufs, peak, name: file.name };
  slot.innerHTML =
    '<p class="tag mono">Deck ' + side + '</p><h3>' + esc(file.name) + '</h3>' +
    '<p class="meta">' +
      '<b>' + lufs.toFixed(1) + '</b> LUFS integrated<br>' +
      '<b>' + peak.toFixed(1) + '</b> dBFS peak<br>' +
      '<b>' + fmtTime(buf.duration) + '</b> · ' + buf.numberOfChannels + ' ch · ' +
      (buf.sampleRate / 1000).toFixed(1) + ' kHz</p>';
  refresh();
}

const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmtTime = s => Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0");

function refresh() {
  const both = decks.A && decks.B;
  document.getElementById("start").disabled = !both;
  const m = document.getElementById("match");
  if (!both) { m.innerHTML = ""; return; }
  const diff = decks.A.lufs - decks.B.lufs;
  const quieter = diff < 0 ? "A" : "B";
  const trim = Math.abs(diff);
  m.innerHTML =
    '<span class="pill">Δ ' + trim.toFixed(1) + ' LU</span>' +
    '<span class="pill">' + quieter + ' is quieter, so it sets the level</span>' +
    '<span class="pill ' + (trim > 1 ? "hot" : "ok") + '">' +
      (trim > 1
        ? "without matching, the louder one would win on level alone"
        : "already close, the match is a small correction") + '</span>';
}

/* ── the blind test ──────────────────────────────────────────────────────── */
function matchedGain(side) {
  // turn the LOUDER file DOWN to meet the quieter one. Never boost: boosting
  // risks clipping and any limiter that catches it would colour the result.
  const target = Math.min(decks.A.lufs, decks.B.lufs);
  return Math.pow(10, (target - decks[side].lufs) / 20);
}

function stop() {
  if (source) { try { source.stop(); } catch (e) {} source.disconnect(); source = null; }
}

function play(which) {
  stop();
  if (ctx.state === "suspended") ctx.resume();
  const side = which === "x" ? current.x : current[which];
  source = ctx.createBufferSource();
  source.buffer = decks[side].buf;
  gainNode = ctx.createGain();
  gainNode.gain.value = matchedGain(side);
  source.connect(gainNode).connect(ctx.destination);
  source.start(0, Math.min(20, decks[side].buf.duration * 0.25));
}

function nextTrial() {
  const flip = Math.random() < 0.5;
  current = { first: flip ? "A" : "B", second: flip ? "B" : "A" };
  if (abxMode) current.x = Math.random() < 0.5 ? current.first : current.second;
  document.getElementById("trialLabel").textContent = "Trial " + (trials.length + 1);
  document.getElementById("playX").style.display = abxMode ? "" : "none";
  document.getElementById("prompt").textContent = abxMode
    ? "X is secretly the first or the second. Play all three, then pick the one X matches. This tests whether you can hear a difference at all."
    : "Play each one, then pick the one you prefer. You are not told which is which, and both are at the same loudness.";
}

function pick(choice) {
  const chosenSide = current[choice];
  trials.push(abxMode
    ? { correct: chosenSide === current.x }
    : { side: chosenSide });
  stop();
  nextTrial();
  renderVerdict();
}

function renderVerdict() {
  const v = document.getElementById("verdict");
  if (trials.length < 1) { v.classList.add("hidden"); return; }
  v.classList.remove("hidden");
  if (abxMode) {
    const right = trials.filter(t => t.correct).length, n = trials.length;
    // one-tailed binomial tail at p = 0.5
    const C = (a, b) => { let r = 1; for (let i = 0; i < b; i++) r = r * (a - i) / (i + 1); return r; };
    let p = 0; for (let k = right; k <= n; k++) p += C(n, k);
    p /= Math.pow(2, n);
    v.innerHTML = '<p class="mono" style="color:var(--faint)">Can you hear a difference?</p>' +
      '<table><tr><th>Trials</th><th>Correct</th><th>p-value</th><th>Reading</th></tr>' +
      '<tr><td>' + n + '</td><td><b>' + right + '</b></td><td>' + p.toFixed(3) + '</td><td>' +
      (n < 8 ? "not enough trials yet, do at least 8"
             : p < 0.05 ? '<span class="ok">you can tell them apart</span>'
                        : '<span class="hot">indistinguishable at this level</span>') +
      '</td></tr></table>' +
      '<p class="note">A p-value under 0.05 means a run this good would happen by guessing less than 5 % of the time.</p>';
  } else {
    const a = trials.filter(t => t.side === "A").length, b = trials.length - a;
    v.innerHTML = '<p class="mono" style="color:var(--faint)">Preference, loudness-matched</p>' +
      '<table><tr><th>File</th><th>Picked</th><th>Share</th></tr>' +
      '<tr><td>' + esc(decks.A.name) + '</td><td><b>' + a + '</b></td><td>' +
        (trials.length ? Math.round(a / trials.length * 100) : 0) + ' %</td></tr>' +
      '<tr><td>' + esc(decks.B.name) + '</td><td><b>' + b + '</b></td><td>' +
        (trials.length ? Math.round(b / trials.length * 100) : 0) + ' %</td></tr></table>' +
      '<p class="note">Identities stay hidden while you are choosing. Do at least 6 trials before you believe the split.</p>';
  }
}

/* ── wiring ──────────────────────────────────────────────────────────────── */
["A", "B"].forEach(side => {
  const slot = document.getElementById("slot" + side);
  const input = document.getElementById("file" + side);
  slot.addEventListener("click", () => input.click());
  input.addEventListener("change", e => e.target.files[0] && load(side, e.target.files[0]));
  slot.addEventListener("dragover", e => { e.preventDefault(); slot.classList.add("over"); });
  slot.addEventListener("dragleave", () => slot.classList.remove("over"));
  slot.addEventListener("drop", e => {
    e.preventDefault(); slot.classList.remove("over");
    const f = e.dataTransfer.files[0]; if (f) load(side, f);
  });
});

document.getElementById("start").addEventListener("click", () => {
  trials = []; nextTrial();
  document.getElementById("stage").classList.remove("hidden");
  renderVerdict();
});
document.getElementById("mode").addEventListener("click", e => {
  abxMode = !abxMode; trials = [];
  e.target.textContent = "Mode: " + (abxMode ? "A/B/X can you hear it" : "A/B preference");
  if (current) nextTrial();
  renderVerdict();
});
document.getElementById("reset").addEventListener("click", () => location.reload());
document.getElementById("stopBtn").addEventListener("click", stop);
document.querySelectorAll("[data-play]").forEach(b =>
  b.addEventListener("click", () => play(b.dataset.play)));
document.querySelectorAll("[data-pick]").forEach(b =>
  b.addEventListener("click", () => pick(b.dataset.pick)));
