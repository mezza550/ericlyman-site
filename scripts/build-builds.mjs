import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = join(root, "builds", "content");
const HOME_BUILD_LIMIT = 4;
const SITE = "https://ericlyman.com";
const OG_DEFAULT = "/img/og-default.png";
const INTRO = "Tools and agents I've designed and built with AI. Each page covers the process, the checks I put around it, and the results.";
const TAGS = [
  "Process redesign",
  "Human approval",
  "Evals",
  "Rules in code",
  "Data reconciliation",
  "Multi-system automation",
  "Local AI",
  "Privacy by design",
  "Automated testing",
  "Human-in-the-loop"
];
const STATUSES = ["In daily use", "In testing", "In progress", "Retired"];
const CONTEXTS = ["Personal project", "Work project", "Small-business project"];
const OWNERS = ["Person", "AI", "Code", "TODO"];
const REDIRECTS = {
  "chapter-bridge": "chapterbridge",
  "backoffice-agent": "ruby",
  "back-office-agent": "ruby",
  "melissa-agent": "ruby"
};

const words = (value) => String(value || "").trim().split(/\s+/).filter(Boolean);
const wordCount = (value) => words(value).length;

function warn(file, field, message) {
  console.warn(`WARN ${file} ${field} ${message}`);
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function filled(value) {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function loadBuilds() {
  const files = readdirSync(contentDir).filter((name) => name.endsWith(".json")).sort();
  return files.map((name) => {
    const build = JSON.parse(readFileSync(join(contentDir, name), "utf8"));
    check(name, build);
    return build;
  }).sort((a, b) => a.order - b.order);
}

function check(file, build) {
  const limits = [
    ["users", 40],
    ["card_line", 80],
    ["built_with", 60]
  ];
  for (const [field, limit] of limits) {
    if (filled(build[field]) && build[field].length > limit) {
      warn(file, field, `is ${build[field].length} characters (limit ${limit})`);
    }
  }
  const snapshot = build.snapshot || {};
  for (const field of ["problem", "what_i_built", "result"]) {
    if (filled(snapshot[field]) && snapshot[field].length > 120) {
      warn(file, `snapshot.${field}`, `is ${snapshot[field].length} characters (limit 120)`);
    }
  }
  if (filled(build.problem)) {
    const count = wordCount(build.problem);
    if (count < 40 || count > 80) warn(file, "problem", `is ${count} words (limit 40-80)`);
  }
  const steps = build.how_it_works || [];
  if (steps.length && (steps.length < 3 || steps.length > 7)) {
    warn(file, "how_it_works", `has ${steps.length} steps (limit 3-7)`);
  }
  steps.forEach((step, index) => {
    const count = wordCount(step.text);
    if (count > 25) warn(file, `how_it_works[${index}]`, `is ${count} words (limit 25)`);
    if (step.owner && !OWNERS.includes(step.owner)) warn(file, `how_it_works[${index}].owner`, `is ${step.owner}`);
  });
  const decisions = build.decisions || [];
  if (decisions.length && (decisions.length < 3 || decisions.length > 5)) {
    warn(file, "decisions", `has ${decisions.length} items (limit 3-5)`);
  }
  decisions.forEach((item, index) => {
    const count = wordCount(`${item.decision || ""} ${item.reason || ""}`);
    if (count > 35) warn(file, `decisions[${index}]`, `is ${count} words (limit 35)`);
  });
  const results = build.results || [];
  if (results.length > 4) warn(file, "results", `has ${results.length} items (limit 1-4)`);
  const next = build.next || [];
  if (next.length && (next.length < 2 || next.length > 3)) {
    warn(file, "next", `has ${next.length} items (limit 2-3)`);
  }
  next.forEach((item, index) => {
    const count = wordCount(item);
    if (count > 25) warn(file, `next[${index}]`, `is ${count} words (limit 25)`);
  });
  const tags = build.tags || [];
  if (tags.length && (tags.length < 2 || tags.length > 3)) {
    warn(file, "tags", `has ${tags.length} tags (limit 2-3)`);
  }
  tags.forEach((tag) => {
    if (!TAGS.includes(tag)) warn(file, "tags", `has ${tag}, which is not in the tag list`);
  });
  if (filled(build.status) && !STATUSES.includes(build.status)) {
    warn(file, "status", `is ${build.status}`);
  }
  if (filled(build.context) && !CONTEXTS.includes(build.context)) {
    warn(file, "context", `is ${build.context}`);
  }
  if (build.thumbnail && build.thumbnail.src && !build.thumbnail.alt) {
    warn(file, "thumbnail.alt", "is missing");
  }
  if (build.icon && (build.icon.src || build.icon.alt)) {
    if (!build.icon.src) warn(file, "icon.src", "is missing");
    if (!build.icon.alt) warn(file, "icon.alt", "is missing");
    if (build.icon.src && build.icon.src.startsWith("/")) {
      const iconPath = join(root, build.icon.src.slice(1));
      if (!existsSync(iconPath)) warn(file, "icon.src", `file not found: ${build.icon.src}`);
    }
  }
}

function hasIcon(build) {
  return Boolean(build.icon && build.icon.src);
}

function iconImg(build) {
  if (!hasIcon(build)) return "";
  return `<img class="build-icon" src="${esc(build.icon.src)}" alt="${esc(build.icon.alt || "")}" width="96" height="96">`;
}

function titleRow(build, tag) {
  const icon = iconImg(build);
  const heading = `<${tag}>${esc(build.name)}</${tag}>`;
  if (!icon) return heading;
  return `<div class="build-title">${icon}${heading}</div>`;
}

function thumb(build) {
  if (build.thumbnail && build.thumbnail.src) {
    return `<img class="build-thumb" src="${esc(build.thumbnail.src)}" alt="${esc(build.thumbnail.alt || "")}" width="640" height="360" loading="lazy">`;
  }
  if (hasIcon(build)) return "";
  return `<span class="build-thumb" aria-hidden="true"></span>`;
}

function statusLine(build) {
  const parts = [build.status, build.users].filter(filled);
  if (!parts.length) return "";
  return `<p class="build-status">${esc(parts.join(" · "))}</p>`;
}

function metric(build) {
  const item = build.headline_metric;
  if (!item || !filled(item.value)) return "";
  const basis = item.basis === "expected" ? `<span class="build-metric-basis">Expected</span>` : item.basis === "measured" ? `<span class="build-metric-basis">Measured</span>` : "";
  const label = filled(item.label) ? `<span class="build-metric-label">${esc(item.label)}</span>` : "";
  return `<p class="build-metric"><span class="build-metric-value">${esc(item.value)}</span> ${label} ${basis}</p>`;
}

function tagList(build) {
  if (!build.tags || !build.tags.length) return "";
  return `<ul class="tags" aria-label="Tags">${build.tags.map((tag) => `<li>${esc(tag)}</li>`).join("")}</ul>`;
}

function card(build, heading) {
  const image = thumb(build);
  return `<li>
            <a class="build-card" href="/builds/${esc(build.slug)}/" aria-label="${esc(build.name)}">
              ${image ? `${image}\n              ` : ""}${titleRow(build, heading)}
              <p class="build-line">${esc(build.card_line || "")}</p>
              ${statusLine(build)}
              ${metric(build)}
              ${tagList(build)}
            </a>
          </li>`;
}

function homeSection(builds) {
  const shown = builds.length <= HOME_BUILD_LIMIT ? builds : builds.slice(0, HOME_BUILD_LIMIT);
  const more = builds.length > HOME_BUILD_LIMIT
    ? `\n          <p class="builds-more"><a href="/builds/">All builds</a></p>`
    : "";
  return `        <section id="builds" class="builds rule js-rule" style="--fill: 15.7%" aria-labelledby="builds-h">
          <h2 class="section-title" id="builds-h">Builds</h2>
          <p class="section-lead">${esc(INTRO)}</p>
          <ul class="builds-grid">
            ${shown.map((build) => card(build, "h3")).join("\n            ")}
          </ul>${more}
        </section>`;
}

const headLinks = `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">`;

function pageHead({ title, description, path, css, image, type }) {
  const url = `${SITE}${path}`;
  const imageUrl = image.startsWith("http") ? image : `${SITE}${image}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="${type}">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(imageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(imageUrl)}">
  <meta name="theme-color" content="#faf9f7">
${headLinks}
  <link rel="stylesheet" href="${css}">
</head>`;
}

function topbar(current) {
  const builds = current === "builds" ? `<a href="/builds/" aria-current="page">Builds</a>` : `<a href="/builds/">Builds</a>`;
  return `  <a class="skip-link" href="#main">Skip to content</a>
  <header class="topbar">
    <div class="wrap topbar-inner">
      <a class="name-link" href="/#top">Eric Lyman</a>
      <nav aria-label="Primary">
        ${builds}
        <a href="/#experience">Experience</a>
        <a href="/#education">Education</a>
        <a href="/#contact">Contact</a>
      </nav>
    </div>
  </header>`;
}

const footer = `  <footer class="footer">
    <div class="wrap footer-inner">
      <span>© 2026 Eric Lyman</span>
      <a href="mailto:hello@ericlyman.com">hello@ericlyman.com</a>
    </div>
  </footer>`;

function indexPage(builds) {
  return `${pageHead({
    title: "Builds | Eric Lyman",
    description: INTRO,
    path: "/builds/",
    css: "../style.css",
    image: OG_DEFAULT,
    type: "website"
  })}
<body>
${topbar("builds")}
  <main id="main">
    <div class="wrap builds-index">
      <p class="back-link"><a href="/#top"><span aria-hidden="true">← </span>Back to home</a></p>
      <h1>Builds</h1>
      <p class="section-lead">${esc(INTRO)}</p>
      <ul class="builds-grid">
        ${builds.map((build) => card(build, "h2")).join("\n        ")}
      </ul>
    </div>
  </main>
${footer}
  <script src="../builds.js"></script>
</body>
</html>
`;
}

function metaLine(build) {
  const parts = [build.context, build.status_since, filled(build.built_with) ? build.built_with : "", build.time_to_build].filter(filled);
  if (build.context === "Work project" && filled(build.employer)) parts[0] = `Work project, ${build.employer}`;
  return parts.length ? `<p class="build-facts">${esc(parts.join(" · "))}</p>` : "";
}

function snapshot(build) {
  const rows = [
    ["Problem", build.snapshot && build.snapshot.problem],
    ["What I built", build.snapshot && build.snapshot.what_i_built],
    ["Who uses it", build.users],
    ["Status", [build.status, build.status_since].filter(filled).join(" since ")],
    ["Result", build.snapshot && build.snapshot.result]
  ].filter(([, value]) => filled(value));
  if (!rows.length) return "";
  return `<dl class="snapshot">${rows.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>`;
}

function demo(build) {
  const item = build.demo;
  if (!item || !item.type || !item.sources || !item.sources.length) return "";
  if (item.type === "video") {
    const source = item.sources[0];
    const poster = item.poster ? ` poster="${esc(item.poster)}"` : "";
    const track = item.captions ? `<track kind="captions" src="${esc(item.captions)}" srclang="en" label="English" default>` : "";
    return `<section class="build-block" aria-labelledby="demo-h"><h2 id="demo-h">Demo</h2><video class="build-video" controls preload="none"${poster}>${`<source src="${esc(source.src || source)}" type="${esc(source.type || "video/mp4")}">`}${track}</video></section>`;
  }
  if (item.type === "gif") {
    const src = item.sources[0].src || item.sources[0];
    const poster = item.poster ? `<img class="demo-still" src="${esc(item.poster)}" alt="${esc(item.sources[0].alt || "")}">` : "";
    return `<section class="build-block" aria-labelledby="demo-h"><h2 id="demo-h">Demo</h2><img class="demo-gif" src="${esc(src)}" alt="${esc(item.sources[0].alt || "")}">${poster}</section>`;
  }
  const figures = item.sources.slice(0, 3).map((source) => `<figure><img src="${esc(source.src)}" alt="${esc(source.alt || "")}" loading="lazy"><figcaption>${esc(source.caption || "")}</figcaption></figure>`).join("");
  return `<section class="build-block" aria-labelledby="demo-h"><h2 id="demo-h">Demo</h2><div class="demo-shots">${figures}</div></section>`;
}

function proseSection(id, title, text) {
  if (!filled(text)) return "";
  return `<section class="build-block" aria-labelledby="${id}"><h2 id="${id}">${esc(title)}</h2><p>${esc(text)}</p></section>`;
}

function stepsSection(build) {
  const steps = build.how_it_works || [];
  if (!steps.length) return "";
  const items = steps.map((step, index) => `<li><span class="step-no">${index + 1}</span><div><span class="owner owner-${esc(String(step.owner || "TODO").toLowerCase())}">${esc(step.owner || "TODO")}</span><p>${esc(step.text)}</p></div></li>`).join("");
  return `<section class="build-block" aria-labelledby="works-h"><h2 id="works-h">How it works</h2><ol class="steps">${items}</ol></section>`;
}

function decisionsSection(build) {
  const items = build.decisions || [];
  if (!items.length) return "";
  const list = items.map((item) => `<li><strong>${esc(item.decision || "")}</strong>${filled(item.reason) ? ` ${esc(item.reason)}` : ""}</li>`).join("");
  return `<section class="build-block" aria-labelledby="decisions-h"><h2 id="decisions-h">Decisions and guardrails</h2><ul class="decisions">${list}</ul></section>`;
}

function resultsSection(build) {
  const items = build.results || [];
  if (!items.length) return "";
  const list = items.map((item) => {
    const basis = item.basis === "expected" ? `<span class="result-basis">Expected</span>` : item.basis === "measured" ? `<span class="result-basis">Measured</span>` : "";
    return `<li><span class="result-value">${esc(item.value || "")}</span><span class="result-label">${esc(item.label || "")}</span>${basis}</li>`;
  }).join("");
  return `<section class="build-block" aria-labelledby="results-h"><h2 id="results-h">Results</h2><ul class="result-tiles">${list}</ul></section>`;
}

function nextSection(build) {
  const items = build.next || [];
  if (!items.length) return "";
  return `<section class="build-block" aria-labelledby="next-h"><h2 id="next-h">What I'd change next</h2><ul>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></section>`;
}

function pager(build, builds) {
  const index = builds.findIndex((item) => item.slug === build.slug);
  const prev = builds[index - 1];
  const next = builds[index + 1];
  const prevLink = prev ? `<a href="/builds/${esc(prev.slug)}/">Previous: ${esc(prev.name)}</a>` : "";
  const nextLink = next ? `<a href="/builds/${esc(next.slug)}/">Next: ${esc(next.name)}</a>` : "";
  return `<nav class="build-pager" aria-label="Other builds">${prevLink}<a href="/builds/">All builds</a>${nextLink}</nav>`;
}

function contact() {
  return `<div class="build-contact"><a href="mailto:hello@ericlyman.com">hello@ericlyman.com</a><a class="btn btn--inline" href="/resume/Eric-Lyman-Resume.pdf" download="Eric-Lyman-Resume.pdf"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>Download Resume</a></div>`;
}

function buildPage(build, builds) {
  const image = build.og_image || OG_DEFAULT;
  const description = build.card_line || build.name;
  const title = `${build.name} | Eric Lyman`;
  const note = filled(build.confidentiality_note) ? `<p class="build-note">${esc(build.confidentiality_note)}</p>` : "";
  return `${pageHead({
    title,
    description,
    path: `/builds/${build.slug}/`,
    css: "../../style.css",
    image,
    type: "article"
  })}
<body>
${topbar("builds")}
  <main id="main">
    <article class="build-page">
      <p class="back-link"><a href="/builds/"><span aria-hidden="true">← </span>Back to builds</a></p>
      <header class="build-header">
        ${titleRow(build, "h1")}
        ${filled(build.card_line) ? `<p class="build-subtitle">${esc(build.card_line)}</p>` : ""}
        ${metaLine(build)}
      </header>
      ${snapshot(build)}
      ${resultsSection(build)}
      ${demo(build)}
      ${proseSection("problem-h", "The problem", build.problem)}
      ${stepsSection(build)}
      ${decisionsSection(build)}
      ${nextSection(build)}
      ${note}
      ${pager(build, builds)}
      ${contact()}
    </article>
  </main>
${footer}
</body>
</html>
`;
}

function redirectPage(from, to) {
  const dest = `/builds/${to}/`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Moved | Eric Lyman</title>
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${SITE}${dest}">
  <meta http-equiv="refresh" content="0; url=${dest}">
  <link rel="stylesheet" href="../../style.css">
</head>
<body>
  <main id="main" class="build-page">
    <p>This page has moved. <a href="${dest}">Continue to the build</a>.</p>
  </main>
</body>
</html>
`;
}

const builds = loadBuilds();
const indexPath = join(root, "index.html");
const indexHtml = readFileSync(indexPath, "utf8");
const start = "<!-- BUILDS:START -->";
const end = "<!-- BUILDS:END -->";
if (!indexHtml.includes(start) || !indexHtml.includes(end)) {
  console.error("index.html is missing BUILDS markers");
  process.exit(1);
}
const updated = indexHtml.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}\n${homeSection(builds)}\n        ${end}`);
writeFileSync(indexPath, updated);
writeFileSync(join(root, "builds", "index.html"), indexPage(builds));
for (const build of builds) {
  const dir = join(root, "builds", build.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), buildPage(build, builds));
}
for (const [from, to] of Object.entries(REDIRECTS)) {
  const dir = join(root, "builds", from);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), redirectPage(from, to));
}
console.log(`Wrote ${builds.length} builds. Home limit is ${HOME_BUILD_LIMIT}.`);
