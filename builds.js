(function () {
  var map = {
    "chapter-bridge": "/builds/chapterbridge/",
    "chapterbridge": "/builds/chapterbridge/",
    "backoffice-agent": "/builds/ruby/",
    "back-office-agent": "/builds/ruby/",
    "backup-bucket": "/builds/backup-bucket/",
    "melissa-agent": "/builds/ruby/",
    "ruby": "/builds/ruby/"
  };
  var slug = (location.hash || "").replace(/^#/, "");
  if (!slug || !map[slug]) return;
  var here = location.pathname.replace(/\/$/, "");
  var dest = map[slug].replace(/\/$/, "");
  if (here === dest) return;
  location.replace(map[slug]);
})();

(function () {
  var triggers = document.querySelectorAll("[data-tip]");
  if (!triggers.length) return;
  var open = null;
  var fromKeyboard = false;

  function tipFor(el) {
    var id = el.getAttribute("aria-describedby");
    return id ? document.getElementById(id) : null;
  }

  function hide(el) {
    var tip = tipFor(el);
    if (tip) tip.hidden = true;
    if (open === el) open = null;
  }

  function place(el, tip) {
    var margin = 8;
    var gap = 10;
    tip.hidden = false;
    tip.classList.remove("tip--below");
    tip.style.left = "0px";
    tip.style.top = "0px";
    var bounds = el.getBoundingClientRect();
    var width = tip.offsetWidth;
    var height = tip.offsetHeight;
    var top = bounds.top - height - gap;
    var below = top < margin;
    if (below) top = bounds.bottom + gap;
    if (top + height > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - margin - height);
    }
    var left = bounds.left + bounds.width / 2 - width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - margin - width));
    tip.style.left = left + "px";
    tip.style.top = top + "px";
    var arrow = bounds.left + bounds.width / 2 - left;
    tip.style.setProperty("--arrow", Math.max(14, Math.min(arrow, width - 14)) + "px");
    tip.classList.toggle("tip--below", below);
  }

  function show(el) {
    var tip = tipFor(el);
    if (!tip) return;
    if (open && open !== el) hide(open);
    place(el, tip);
    open = el;
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Tab") fromKeyboard = true;
    if (event.key === "Escape" && open) {
      hide(open);
      event.preventDefault();
    }
  });

  triggers.forEach(function (el) {
    el.addEventListener("pointerenter", function (event) {
      if (event.pointerType === "touch") return;
      show(el);
    });
    el.addEventListener("pointerleave", function (event) {
      if (event.pointerType === "touch") return;
      if (document.activeElement === el && fromKeyboard) return;
      hide(el);
    });
    el.addEventListener("focus", function () {
      if (fromKeyboard) show(el);
    });
    el.addEventListener("blur", function () {
      hide(el);
      fromKeyboard = false;
    });
    el.addEventListener("click", function (event) {
      if (el.tagName !== "BUTTON") return;
      event.preventDefault();
      event.stopPropagation();
      var coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
      if (!coarse) return;
      if (open === el) hide(el);
      else show(el);
    });
  });

  document.addEventListener("pointerdown", function (event) {
    if (!open) return;
    if (open.contains(event.target)) return;
    var tip = tipFor(open);
    if (tip && tip.contains(event.target)) return;
    hide(open);
  });
  window.addEventListener("resize", function () { if (open) hide(open); });
  window.addEventListener("scroll", function () { if (open) hide(open); }, true);
})();
