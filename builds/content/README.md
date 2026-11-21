# Build content

Each build is one JSON file in this folder. Add a build by adding `your-slug.json` and its images, then run:

```
node scripts/build-builds.mjs
```

Commit the JSON and the HTML the script writes. GitHub Pages publishes those files as they are. It does not run the script.

## Fields

| Field | What it holds | Limit |
| --- | --- | --- |
| slug | URL slug. The page is `/builds/<slug>/`. | |
| name | Build name. | |
| order | Display order. Lower numbers come first. | |
| context | `Personal project`, `Work project`, or `Small-business project`. Work projects may include `employer`. | |
| status | One of: In daily use, In testing, In progress, Retired. | |
| status_since | Month and year. | |
| users | Who uses it. | 40 characters |
| card_line | One sentence on the job it does. | 80 characters |
| headline_metric | Optional `value`, `label`, and `basis` (`measured` or `expected`). | |
| tags | Up to 3 concept tags from the list below. On a card with `tools`, these are tag-shaped labels. Other cards keep the plain pills. | |
| tools | Optional tool names for the card's logo row. Names come from `built_with`. The page header still uses `built_with`. | |
| thumbnail | `src` and `alt`. | Image 16:9 |
| icon | Optional `src` and `alt`. Sits beside the name on the card and the page, like the Experience logos. | 96×96 transparent PNG or WebP |
| og_image | Optional sharing image. | 1200×630 |
| built_with | Short tools line. Platform names go here, not in tags. | 60 characters |
| time_to_build | Short text, such as "About five weeks". | |
| snapshot | `problem`, `what_i_built`, and `result`. | 120 characters each |
| demo | Optional `type` (`video`, `gif`, or `images`), `sources`, `poster`, and `captions`. | |
| problem | The manual process before, in plain prose. | 40–80 words |
| how_it_works | 3–7 steps. Each has `text` and `owner` (`Person`, `AI`, `Code`, or `TODO`). | 25 words per step |
| decisions | 3–5 items. Each has `decision` and `reason`. | 35 words per item |
| results | 1–4 items. Each has `value`, `label`, and `basis` (`measured`, `expected`, or `TODO`). | |
| next | What to change next. | 2–3 bullets, 25 words each |
| confidentiality_note | Optional short note. | |
| links | Optional public links, such as a video. | |

Leave a field as `""` or `[]` when it is unknown. The page skips empty sections. Do not write "coming soon".

On the page, the Results tiles sit directly under the snapshot and before The problem. A build with no results skips that heading.

The script prints a warning when a filled field is outside its limit. It still writes the page, and the site shows the full text.

## Tags

Process redesign, Human approval, Evals, Rules in code, Data reconciliation, Multi-system automation, Local AI, Privacy by design, Automated testing, Human-in-the-loop, Small Business, Accounting.

`tag-glossary.json` holds an optional description for a tag. The card reuses that text for every build with the tag. A tag with no entry shows no bubble. Bubbles are on the cards only.

- Tool logos: Simple Icons, CC0, stored in `img/tools/` and inlined on the card. They are about 20px, gray by default, and ruby when the card is hovered or focused. Each logo is a button with a styled bubble for its name. A name with no file falls back to a small text label. The bubble also opens on keyboard focus, and a tap toggles it on a touch screen.

## Images

- Card thumbnail: 16:9, WebP or AVIF, with alt text. The card uses a gray block when both `thumbnail` and `icon` are empty. A build with an icon and no thumbnail drops that gray block.
- Icon: 96×96 transparent PNG or WebP, with alt text. It is shown at 44px (40px under 560px) in a column beside the title, with a 14px gap (12px under 560px). No empty box when `icon` is omitted.
- Open Graph image: 1200×630. When `og_image` is empty, the page uses `/img/og-default.png`.
- Tool logos: Simple Icons, CC0, stored in `img/tools/` and inlined on the card. See the tag section for how the bubble works. A name with no file falls back to a small text label.

| Tool name | File |
| --- | --- |
| Python | `img/tools/python.svg` |
| SQLite | `img/tools/sqlite.svg` |
| DeepSeek | `img/tools/deepseek.svg` |
| OpenRouter | `img/tools/openrouter.svg` |
| Claude Code | `img/tools/claude.svg` (the Claude mark) |
| Gemini | `img/tools/gemini.svg` |

## Home page

`HOME_BUILD_LIMIT` in `scripts/build-builds.mjs` is 4. The home page shows every build while there are that many or fewer.
