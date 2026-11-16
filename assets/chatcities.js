// The illustrative 03:14 chat cycles through the UK and EU cities we sell to.
// Reduced-motion visitors keep the first city. No network, no storage.
(function () {
  var box = document.querySelector(".phone[data-cities]");
  if (!box || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
  var list = box.getAttribute("data-cities").split("|").map(function (x) { var p = x.split(":"); return [p[0], p[1]]; });
  var tmp = document.createElement("textarea"), i = 0;
  function dec(s) { tmp.innerHTML = s; return tmp.value; }
  setInterval(function () {
    i = (i + 1) % list.length;
    box.classList.add("ct-fade");
    setTimeout(function () {
      var c = box.querySelectorAll(".ct-city"), u = box.querySelectorAll(".ct-cur"), k;
      for (k = 0; k < c.length; k++) c[k].textContent = list[i][0];
      for (k = 0; k < u.length; k++) u[k].textContent = dec(list[i][1]);
      box.classList.remove("ct-fade");
    }, 350);
  }, 6000);
})();
