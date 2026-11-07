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
    + "#ati-chat form button{background:#d9c58b;color:#0e2621;border:0;border-radius:8px;padding:0 12px;font-weight:600;cursor:pointer}";
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
  btn.onclick = function () { box.classList.toggle("open"); if (box.classList.contains("open")) input.focus(); };
  box.querySelector("header button").onclick = function () { box.classList.remove("open"); };
  box.querySelector("form").onsubmit = function (e) {
    e.preventDefault();
    var q = input.value.trim(); if (!q || busy) return;
    input.value = ""; add(q, "user"); msgs.push({ role: "user", content: q });
    busy = true; var wait = add("…", "assistant");
    fetch(EP + "/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: msgs.slice(-12), session: session }) })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) { wait.textContent = d.reply; msgs.push({ role: "assistant", content: d.reply }); })
      .catch(function () { wait.textContent = T.err; msgs.pop(); })
      .then(function () { busy = false; log.scrollTop = log.scrollHeight; });
  };
})();
