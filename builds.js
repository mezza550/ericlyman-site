(function () {
  var map = {
    "chapter-bridge": "/builds/chapterbridge/",
    "chapterbridge": "/builds/chapterbridge/",
    "backoffice-agent": "/builds/back-office-agent/",
    "back-office-agent": "/builds/back-office-agent/",
    "backup-bucket": "/builds/backup-bucket/",
    "melissa-agent": "/builds/back-office-agent/"
  };
  var slug = (location.hash || "").replace(/^#/, "");
  if (!slug || !map[slug]) return;
  var here = location.pathname.replace(/\/$/, "");
  var dest = map[slug].replace(/\/$/, "");
  if (here === dest) return;
  location.replace(map[slug]);
})();
