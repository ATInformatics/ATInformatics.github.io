/* Website assistant chat (2026-11-07). Talks to our own fallback server
   (ship/assistant/assistant_server.py): Voiceflow first when it has credits,
   then Groq -> Gemini -> OpenRouter. Endpoint comes from data-endpoint on the
   script tag. No cookies, nothing stored beyond this tab. */
(function () {
  var me = document.currentScript, EP = me && me.getAttribute("data-endpoint");
  if (!EP) return;
  var bg = document.documentElement.lang === "bg";
  var T = bg ? { open: "Въпроси? Пишете ни", title: "Асистент на A.T. Informatics", ph: "Напишете въпрос…", send: "Изпрати",
                 hi: "Здравейте. Мога да отговоря на въпроси за сайтове, AI асистенти и цени.", err: "Асистентът не е на линия. Пишете на info@atinformatics.com." }
             : { open: "Questions? Chat with us", title: "A.T. Informatics assistant", ph: "Type a question…", send: "Send",
                 hi: "Hi. I can answer questions about websites, AI assistants and prices.", err: "The assistant is offline. Please email info@atinformatics.com." };
  var css = "#ati-chat-btn{position:fixed;right:20px;bottom:20px;z-index:50;font:600 14px/1 -apple-system,sans-serif;color:#0e2621;background:#d9c58b;border:0;border-radius:24px;padding:13px 18px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}"
    + "#ati-chat{position:fixed;right:20px;bottom:76px;z-index:50;width:min(360px,calc(100vw - 32px));height:min(480px,calc(100vh - 110px));display:none;flex-direction:column;background:#0e2621;color:#eef7f2;border:1px solid #244a42;border-radius:14px;overflow:hidden;font:14px/1.45 -apple-system,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.35)}"
    + "#ati-chat.open{display:flex}#ati-chat header{padding:12px 14px;font-weight:600;border-bottom:1px solid #244a42;display:flex;justify-content:space-between}"
    + "#ati-chat header button{background:none;border:0;color:#9fb3ac;font-size:18px;cursor:pointer}"
    + "#ati-log{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:8px}"
    + ".ati-m{max-width:85%;padding:8px 11px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}.ati-a{background:#12302a;align-self:flex-start}.ati-u{background:#d9c58b;color:#0e2621;align-self:flex-end}"
    + "#ati-chat form{display:flex;gap:6px;padding:10px;border-top:1px solid #244a42}#ati-chat input{flex:1;min-width:0;background:#12302a;color:#eef7f2;border:1px solid #244a42;border-radius:8px;padding:9px;font:inherit}"
    + "#ati-chat form button{background:#d9c58b;color:#0e2621;border:0;border-radius:8px;padding:0 12px;font-weight:600;cursor:pointer}"
    + ".ati-slots{display:flex;flex-wrap:wrap;gap:6px;align-self:stretch}.ati-slots>button{background:#12302a;color:#eef7f2;border:1px solid #d9c58b;border-radius:18px;padding:7px 11px;font:inherit;cursor:pointer}"
    + ".ati-slots>button.on{background:#d9c58b;color:#0e2621}#ati-chat .ati-slots form{display:flex;flex-direction:column;gap:6px;width:100%;padding:8px 0 0;border:0}#ati-chat .ati-slots form button{padding:10px;font-size:14px}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var btn = document.createElement("button"); btn.id = "ati-chat-btn"; btn.type = "button"; btn.textContent = T.open;
  var box = document.createElement("div"); box.id = "ati-chat"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", T.title);
  box.innerHTML = "<header><span></span><button type='button' aria-label='Close'>×</button></header><div id='ati-log' aria-live='polite'></div>"
    + "<form><input maxlength='1000' autocomplete='off'><button type='submit'></button></form>";
  box.querySelector("header span").textContent = T.title;
  box.querySelector("input").placeholder = T.ph; box.querySelector("form button").textContent = T.send;
  document.body.appendChild(btn); document.body.appendChild(box);
  var log = box.querySelector("#ati-log"), input = box.querySelector("input"), msgs = [], busy = false;
  var session = Math.random().toString(36).slice(2);
  function add(text, who) { var d = document.createElement("div"); d.className = "ati-m " + (who === "user" ? "ati-u" : "ati-a"); d.textContent = text; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
  add(T.hi, "assistant");
  // Real bookings (2026-11-27): the server sends Cal.com's own free times; a tap + name + email books one.
  var LB = bg ? { none: "Няма свободни часове в следващите дни. Моля, обадете ни се или ни пишете.", name: "Вашето име", email: "Вашият имейл", book: "Запази", done: "Запазено: %s. Потвърждението идва по имейл.", fail: "Този час не можа да се запази. Изберете друг" } : { none: "No free times in the next few days. Please call or email us.", name: "Your name", email: "Your email", book: "Book", done: "Booked: %s. A confirmation email is on its way.", fail: "That time could not be booked. Pick another" };
  function slotsUI(slots, bookUrl, L, cls) {
    var wrap = document.createElement("div"); wrap.className = cls + "-slots";
    if (!slots.length) { wrap.textContent = L.none; log.appendChild(wrap); return; }
    slots.forEach(function (s) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = s.label;
      b.onclick = function () {
        wrap.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); });
        var f = wrap.querySelector("form") || document.createElement("form");
        f.innerHTML = "<input name='n' maxlength='80' autocomplete='name' required><input name='e' type='email' maxlength='254' autocomplete='email' required><button type='submit'></button>";
        f.querySelector("[name=n]").placeholder = L.name; f.querySelector("[name=e]").placeholder = L.email; f.querySelector("button").textContent = L.book + " " + s.label;
        wrap.appendChild(f); f.querySelector("[name=n]").focus();
        f.onsubmit = function (ev) {
          ev.preventDefault(); var sb = f.querySelector("button"); sb.disabled = true;
          fetch(bookUrl, { method: "POST", headers: { "Content-Type": "application/json" },
                           body: JSON.stringify({ start: s.start, name: f.querySelector("[name=n]").value, email: f.querySelector("[name=e]").value }) })
            .then(function (r) { return r.json(); })
            .then(function (d) { if (d.ok) { wrap.innerHTML = ""; add(L.done.replace("%s", d.when), "assistant"); } else { sb.disabled = false; add(L.fail + (d.message ? " (" + d.message + ")" : ""), "assistant"); } })
            .catch(function () { sb.disabled = false; add(L.fail, "assistant"); });
        };
        log.scrollTop = log.scrollHeight;
      };
      wrap.appendChild(b);
    });
    log.appendChild(wrap); log.scrollTop = log.scrollHeight;
  }

  btn.onclick = function () { box.classList.toggle("open"); if (box.classList.contains("open")) input.focus(); };
  box.querySelector("header button").onclick = function () { box.classList.remove("open"); };
  box.querySelector("form").onsubmit = function (e) {
    e.preventDefault();
    var q = input.value.trim(); if (!q || busy) return;
    input.value = ""; add(q, "user"); msgs.push({ role: "user", content: q });
    busy = true; var wait = add("…", "assistant");
    fetch(EP + "/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: msgs.slice(-12), session: session }) })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) { wait.textContent = d.reply; msgs.push({ role: "assistant", content: d.reply });
        if (d.slots) slotsUI(d.slots, EP + "/book/at-informatics", LB, "ati"); })
      .catch(function () { wait.textContent = T.err; msgs.pop(); })
      .then(function () { busy = false; log.scrollTop = log.scrollHeight; });
  };
})();
