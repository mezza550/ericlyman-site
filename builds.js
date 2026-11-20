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
