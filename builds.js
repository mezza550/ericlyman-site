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

(function () {
  var galleries = document.querySelectorAll(".shot-gallery");
  if (!galleries.length || typeof HTMLDialogElement === "undefined") return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function mostlyVisible(el) {
    var rect = el.getBoundingClientRect();
    if (!rect.height) return false;
    var view = window.innerHeight || document.documentElement.clientHeight;
    var visible = Math.min(rect.bottom, view) - Math.max(rect.top, 0);
    return visible / rect.height >= 0.4;
  }

  function clearSize(el) {
    el.style.width = "";
    el.style.height = "";
    el.style.maxWidth = "";
    el.style.maxHeight = "";
  }

  function fit(el, dialog) {
    var nw = el.naturalWidth || el.videoWidth;
    var nh = el.naturalHeight || el.videoHeight;
    if (!nw || !nh || !dialog.open) return;
    var padX = 24;
    var vw = window.innerWidth || document.documentElement.clientWidth;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var maxW = Math.min(Math.floor(vw * 0.95) - padX, nw);
    var room = vh - 16;
    function place(limitH) {
      var capH = Math.min(limitH, nh);
      var scale = Math.min(maxW / nw, capH / nh, 1);
      var w = Math.max(1, Math.floor(nw * scale));
      var h = Math.max(1, Math.round(w * nh / nw));
      if (h > capH) {
        h = Math.max(1, Math.floor(capH));
        w = Math.max(1, Math.round(h * nw / nh));
      }
      if (w > maxW) w = maxW;
      el.style.width = w + "px";
      el.style.height = h + "px";
      el.style.maxWidth = w + "px";
      el.style.maxHeight = h + "px";
      dialog.style.width = (w + padX) + "px";
    }
    place(Math.min(Math.floor(vh * 0.85), room, nh));
    var overflow = dialog.scrollHeight - room;
    if (overflow > 1) {
      var used = el.getBoundingClientRect().height;
      place(Math.max(80, Math.floor(used - overflow)));
    }
  }

  galleries.forEach(function (gallery) {
    var dialog = gallery.querySelector(".shot-dialog");
    var items = gallery.querySelectorAll(".shot-open, .shot-link");
    if (!dialog || !items.length) return;
    var image = dialog.querySelector(".shot-dialog-img");
    var video = dialog.querySelector(".shot-dialog-video");
    var caption = dialog.querySelector(".shot-dialog-cap");
    var closeButton = dialog.querySelector("[data-shot-close]");
    var prevButton = dialog.querySelector("[data-shot-prev]");
    var nextButton = dialog.querySelector("[data-shot-next]");
    var index = 0;
    var opener = null;
    var held = [];

    function hold(inline) {
      if (!inline || held.indexOf(inline) !== -1) return;
      inline.setAttribute("data-held", "true");
      inline.pause();
      held.push(inline);
    }

    function stopDialogVideo() {
      if (!video) return;
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.hidden = true;
      clearSize(video);
    }

    function releaseHeld() {
      held.forEach(function (inline) {
        inline.removeAttribute("data-held");
        if (!reduce && mostlyVisible(inline)) {
          var play = inline.play();
          if (play && play.catch) play.catch(function () {});
        }
      });
      held = [];
    }

    function show(next) {
      var count = items.length;
      index = (next + count) % count;
      var item = items[index];
      var figure = item.closest("figure");
      var figcaption = figure ? figure.querySelector("figcaption") : null;
      caption.textContent = item.getAttribute("data-caption") || (figcaption ? figcaption.textContent : "");
      if (item.getAttribute("data-kind") === "video") {
        image.hidden = true;
        image.removeAttribute("src");
        image.removeAttribute("srcset");
        video.hidden = false;
        video.poster = item.getAttribute("data-poster") || "";
        video.src = item.getAttribute("data-src") || "";
        video.muted = true;
        video.loop = true;
        video.controls = true;
        video.setAttribute("aria-label", item.getAttribute("aria-label") || "");
        hold(item.parentNode.querySelector("video.demo-clip"));
        clearSize(video);
        video.onloadedmetadata = function () { fit(video, dialog); };
        if (video.readyState >= 1) fit(video, dialog);
        if (reduce) video.pause();
        else {
          var play = video.play();
          if (play && play.catch) play.catch(function () {});
        }
      } else {
        stopDialogVideo();
        var thumb = item.querySelector("img");
        image.hidden = false;
        image.alt = thumb ? thumb.alt : "";
        clearSize(image);
        image.onload = null;
        image.removeAttribute("src");
        image.sizes = "(min-width: 1200px) 2400px, 95vw";
        image.srcset = item.getAttribute("data-srcset") || "";
        image.onload = function () { fit(image, dialog); };
        image.src = item.href;
        if (image.complete && image.naturalWidth) fit(image, dialog);
      }
      if (count < 2) {
        prevButton.hidden = true;
        nextButton.hidden = true;
      }
    }

    function fitOpen() {
      var el = image.hidden ? video : image;
      if (el && !el.hidden) fit(el, dialog);
    }

    function openAt(next, from) {
      opener = from || null;
      show(next);
      if (!dialog.open) dialog.showModal();
      fitOpen();
      closeButton.focus();
    }

    items.forEach(function (item, itemIndex) {
      item.addEventListener("click", function (event) {
        if (item.tagName === "A") event.preventDefault();
        openAt(itemIndex, item);
      });
    });

    prevButton.addEventListener("click", function () { show(index - 1); });
    nextButton.addEventListener("click", function () { show(index + 1); });
    closeButton.addEventListener("click", function () { dialog.close(); });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", function () {
      stopDialogVideo();
      clearSize(image);
      dialog.style.width = "";
      releaseHeld();
      if (opener) opener.focus();
    });
    window.addEventListener("resize", function () {
      if (dialog.open) fitOpen();
    });
    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        show(index + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        show(index - 1);
      }
    });
  });

  document.querySelectorAll("video.demo-clip").forEach(function (video) {
    var clip = video.closest(".shot-clip");
    if (reduce) {
      video.controls = true;
      video.removeAttribute("aria-hidden");
      if (clip) clip.classList.add("is-reduced");
      return;
    }
    if (typeof IntersectionObserver === "undefined") return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target.getAttribute("data-held") === "true") {
          entry.target.pause();
          return;
        }
        if (entry.isIntersecting) {
          var play = entry.target.play();
          if (play && play.catch) play.catch(function () {});
        } else {
          entry.target.pause();
        }
      });
    }, { threshold: 0.4 }).observe(video);
  });
})();
