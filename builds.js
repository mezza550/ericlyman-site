(function () {
  var SLUG = /^[a-z0-9-]+$/;
  var dialog = document.createElement("dialog");
  dialog.className = "build-dialog";
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "build-dialog-title");
  dialog.innerHTML =
    '<div class="build-dialog-bar"><button type="button" class="build-dialog-close" aria-label="Close">' +
    '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
    "</button></div><div class=\"build-dialog-body\"></div>";
  document.body.appendChild(dialog);

  var closeBtn = dialog.querySelector(".build-dialog-close");
  var body = dialog.querySelector(".build-dialog-body");
  var opener = null;
  var currentSlug = null;
  var requestToken = 0;

  function linkFor(slug) {
    if (!SLUG.test(slug)) return null;
    return document.querySelector('a[data-build="' + slug + '"]');
  }

  function setHash(slug) {
    var base = location.pathname + location.search;
    var next = slug ? base + "#" + slug : base;
    if ((location.pathname + location.search + location.hash) !== next) {
      history.replaceState(null, "", next);
    }
  }

  function showMessage(title, href) {
    body.replaceChildren();
    var heading = document.createElement("p");
    heading.id = "build-dialog-title";
    heading.textContent = title;
    body.appendChild(heading);
    if (href) {
      var para = document.createElement("p");
      var link = document.createElement("a");
      link.href = href;
      link.textContent = "Open the page";
      para.appendChild(link);
      body.appendChild(para);
    }
  }

  function rewriteUrls(root, base) {
    var nodes = root.querySelectorAll("[src], a[href]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      ["src", "href"].forEach(function (attr) {
        var val = el.getAttribute(attr);
        if (!val || val.charAt(0) === "#" || /^(mailto:|tel:|https?:|\/)/.test(val)) return;
        el.setAttribute(attr, new URL(val, base).href);
      });
    }
  }

  function fill(url, token) {
    dialog.setAttribute("aria-busy", "true");
    showMessage("Loading…");
    fetch(url, { headers: { Accept: "text/html" } }).then(function (res) {
      if (!res.ok) throw new Error("status");
      return res.text();
    }).then(function (html) {
      if (token !== requestToken || !dialog.open) return;
      var doc = new DOMParser().parseFromString(html, "text/html");
      var article = doc.querySelector("article.build-page");
      if (!article) throw new Error("article");
      var back = article.querySelector(".back-link");
      if (back) back.remove();
      var scripts = article.querySelectorAll("script");
      for (var i = 0; i < scripts.length; i++) scripts[i].remove();
      rewriteUrls(article, url);
      var heading = article.querySelector("h1");
      if (heading) heading.id = "build-dialog-title";
      body.replaceChildren();
      while (article.firstChild) body.appendChild(article.firstChild);
      dialog.setAttribute("aria-busy", "false");
    }).catch(function () {
      if (token !== requestToken || !dialog.open) return;
      showMessage("This build could not be loaded.", url);
      dialog.setAttribute("aria-busy", "false");
    });
  }

  function openBuild(link, fromHash) {
    var slug = link.getAttribute("data-build");
    if (!slug) return;
    opener = link;
    currentSlug = slug;
    if (!fromHash) setHash(slug);
    var token = ++requestToken;
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add("build-dialog-open");
    closeBtn.focus();
    fill(link.href, token);
  }

  function syncFromHash() {
    var slug = location.hash.replace(/^#/, "");
    if (!slug) {
      if (dialog.open) dialog.close();
      return;
    }
    if (slug === currentSlug && dialog.open) return;
    var link = linkFor(slug);
    if (link) openBuild(link, true);
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest ? e.target.closest("a[data-build]") : null;
    if (!link) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    openBuild(link, false);
  });

  closeBtn.addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (e) {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", function () {
    requestToken++;
    document.documentElement.classList.remove("build-dialog-open");
    currentSlug = null;
    if (location.hash) setHash(null);
    if (opener) opener.focus();
    opener = null;
  });
  window.addEventListener("hashchange", syncFromHash);
  if (location.hash) syncFromHash();
})();
