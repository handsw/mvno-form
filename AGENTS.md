# MVNO Offline Application Form - Agent Instructions

The operator is a non-developer; keep replies short, in Korean, and say plainly
what changed.

## What this is
Static site (no build, no server, no data storage) for in-store MVNO sign-up.
Staff fill the form, the customer signs on a canvas, and the page prints as
exactly 3 A4 pages. Nothing is sent anywhere; never add storage or network calls
for customer data.

- `index.html` network chooser -> `LG_v3.html` / `KT_v2.html`; `guardian.html`
  법정대리인 가입동의서.
- `LG_corp_v4.html` corporate form: a separate page not linked from `index.html`;
  its URL is shared only with corporate staff. Optional short link in
  `_redirects` (`/f6pq8acy7w -> /LG_corp_v4`, works on Cloudflare Pages).
- Shared `app.js` (wizard, validation, signature, print) and `style.css`
  (screen + print layout); `fonts/` are self-hosted Noto Sans KR subsets.

## Rules
- Big changes go into a new versioned copy (e.g. `LG_v4.html`); switch the link in
  `index.html` or `_redirects` only when it is done, so stores keep working.
- LG/KT/corporate forms share most wording; check whether a text change applies
  to all of them.
- After any change, check print preview: every form must stay at 3 A4 pages.
- 개인정보 동의서 wording changes need legal/privacy sign-off before release.
- Deployment: Cloudflare Pages, framework None, no build command, output `/`.
  Push to `main` deploys in 1-2 minutes.
