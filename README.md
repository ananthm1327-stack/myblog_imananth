# I'm Ananth

> A quiet corner of the internet — a personal editorial blog for **journals**, **photographs**, **lived experiences**, **articles**, and honest **views** on the world.

Built with React + Vite. Editorial gold-on-paper aesthetic inspired by classic author sites. Owner-only publishing, contact + newsletter forms wired straight to a real inbox, and no backend to maintain.

Live inbox: `ananth.machiraju@outlook.com`

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Owner Sign-In](#owner-sign-in)
- [Content Storage](#content-storage)
- [Contact & Newsletter](#contact--newsletter)
- [Design System](#design-system)
- [Customization](#customization)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

- **Five content sections** — Journal, Photos, Experiences, Articles, Views. Each has its own list page and per-post detail page.
- **Owner-only publishing** — a password-gated sign-in. Only Ananth can create or delete posts; everyone else browses read-only.
- **Contact form** — one-click send to Ananth's inbox via [FormSubmit](https://formsubmit.co), no backend, no signup.
- **Newsletter subscribe** — footer subscribe form uses the same FormSubmit route, tagged so subscribers land in a filterable inbox.
- **Auto-appended signature** — every long-form post ends with a hand-signed "Ananth Machiraju" block, tinted gold via CSS mask.
- **Custom logo mark** — hand-drawn SVG "A + diamond flourish" used across the navbar, footer, favicon, and Apple touch icon.
- **Stunning ambient background** — a fixed layered stack of warm paper base, faint ruled journal lines, three drifting gold aurorae, subtle SVG noise grain, and a titanium vignette.
- **Editorial hero** — Great Vibes cursive wordmark with an oversized initial "A", champagne shine sweep, and a serif tagline with gold italic keywords.
- **Rich footer** — 3-column layout (About / Explore / Newsletter), five circular gold social icons wired to Ananth's real handles, ornate rotating-diamond divider, and a giant "A" watermark.
- **Sign-in modal** — restricted-area styling with gold lock icon, explanatory copy ("readers don't need to sign in"), auto-focused input, and pop-in animation.
- **Full responsive design** — dedicated tablet (≤1024px), mobile (≤760px), small-phone (≤380px), and landscape-phone breakpoints.
- **Mobile drawer nav** — hamburger button opens a right-side glassy drawer with big serif nav links, backdrop blur, and 44px touch targets.
- **Accessibility** — `prefers-reduced-motion` respected on all ambient animation, ARIA labels on icon buttons, keyboard-navigable sign-in, minimum 44px touch targets on mobile.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| **Framework** | React 18 | Component composition + declarative routing |
| **Bundler** | Vite 5 | Instant HMR and fast production builds |
| **Routing** | react-router-dom 6 | Nested routes for sections + detail views |
| **Storage** | Browser localStorage | Zero-backend personal blog |
| **Forms** | [FormSubmit](https://formsubmit.co) | Contact & newsletter → inbox, no signup |
| **Typography** | Cormorant Garamond, Great Vibes, Inter | Editorial serif + script + neutral sans |
| **Icons** | Inline SVG | No icon-library dependency |
| **Styling** | Vanilla CSS | Single `styles.css`, CSS custom properties for the palette |

---

## Quick Start

**Prerequisites:** Node 18+ and npm.

```bash
git clone https://github.com/ananthm1327-stack/myblog_imananth.git
cd myblog_imananth
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server with HMR on port 5173 |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |

---

## Project Structure

```
myblog_imananth/
├── public/
│   ├── logo.svg              # Hand-drawn "A" monogram (used as favicon too)
│   ├── signature.png         # Ananth's black-ink signature (tinted gold via CSS mask)
│   └── fonts/                # Optional custom fonts (e.g. DistroPiax)
├── src/
│   ├── main.jsx              # React entry, seeds dummy content on first load
│   ├── App.jsx               # Router, navbar, mobile drawer, sign-in modal
│   ├── styles.css            # All styling (single source of truth)
│   ├── store.js              # localStorage helpers + owner auth
│   ├── seed.js               # Dummy content for first-run demo
│   ├── components/
│   │   └── Footer.jsx        # 3-column footer w/ socials + newsletter
│   └── pages/
│       ├── Home.jsx          # Hero + 3-item preview per section
│       ├── Section.jsx       # Section listing + owner "New Post" form
│       ├── PostDetail.jsx    # Full post + auto signature block
│       └── Contact.jsx       # Contact form → FormSubmit → inbox
├── index.html                # Root HTML w/ Google Fonts + favicon
├── vite.config.js
└── package.json
```

---

## Owner Sign-In

Publishing is restricted so only Ananth can add or delete posts.

1. Click **Sign In** in the navbar → the restricted-access modal appears (centered, blurred backdrop, gold lock icon).
2. Enter the owner password. Default is set in `src/store.js`:
   ```js
   export const OWNER_PASSWORD = 'xxxxxxxxxx'
   ```
   **Change this before deploying.** The password is a client-side gate — anyone determined enough to look at the bundle can find it. It's intended to keep casual readers from posting, not to protect against a real attacker.
3. Once signed in, a **+ New** button appears in each section and delete buttons appear on cards + post detail pages.
4. **Sign Out** appears in the navbar; auth is stored in `sessionStorage` so it clears when you close the tab.

Readers do not need to sign in — everything is browsable freely.

---

## Cross-device sync (optional Supabase backend)

By default the app stores everything in `localStorage`, so posts only exist in the browser you posted from. To make posts + comments follow you across devices, wire in a free Supabase project — no server code required.

### 1. Create the project

1. Sign in at [supabase.com](https://supabase.com) and create a new project.
2. In the SQL editor, open [`supabase/schema.sql`](supabase/schema.sql), paste the whole file, and run it.
3. Copy your **Project URL** and the **anon public key** from Settings → API.

### 2. Configure the client

Copy the env template and fill in the values:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```ini
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_OWNER_TOKEN=a-40-char-random-string
```

The **owner token** is your write secret. Any client with this token can insert/update/delete posts and moderate comments through the anon key. Keep it out of git. `.env.local` is already gitignored.

### 3. How it works

**Once Supabase is configured, it is the single source of truth.** `localStorage` is only a fast local cache/mirror of whatever's in the database — the app never invents or preserves local-only content once a backend is wired up:

- **No demo seeding.** `seedIfEmpty()` only runs when Supabase is *not* configured. With a backend enabled, an empty database means an empty (correctly empty) site — no leftover dummy posts pretending to be real content.
- **`pullAll()` fully replaces** the local mirror for posts and comments with exactly what's in Supabase (no merge, no "keep my local edits" logic). This runs:
  - once at boot,
  - immediately after any realtime event (insert/update/delete anywhere in `posts` or `comments`, debounced ~300ms),
  - and every 45s on a background poll (a fallback in case realtime isn't enabled on the project).
- **Live UI updates.** A tiny pub/sub (`src/lib/bus.js`) notifies every open page after a pull completes, so Home/Section/PostDetail/Bookmarks/Moderation all re-render with fresh data automatically — no manual refresh needed on any device.
- **Writes are fire-and-forget mirrors.** When the owner creates/edits/deletes a post, or a reader submits a comment, or the owner approves one, the local write completes instantly (so the UI feels instant) and is mirrored to Supabase in the background. Failures log to the console; they never block the UI. The very next pull/realtime event reconciles anything that failed.
- **Backend status pill** on the `/moderation` page shows whether Supabase is connected and live-syncing, plus a **Pull now** button to force an immediate refresh.
- **Reader-only state stays local by design** — bookmarks (`ia_bookmarks`) and "have I already reacted to this comment" (`ia_reactions_mine`) are per-browser preferences, not shared content, so they are never pulled from or pushed to the backend.
- If the env vars are missing, `isSupabaseEnabled` is `false` and the app falls back to local-only demo mode — nothing crashes.

### 4. Enable Realtime (for instant cross-tab/cross-device updates)

`supabase/schema.sql` includes the SQL to add `posts` and `comments` to the `supabase_realtime` publication — running the schema file (step 1) already does this. If you skipped that or added the tables after the fact, run just this part again:

```sql
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table comments;
```

Without this, the app still stays correct via the 45-second background poll — you just won't see other devices' changes appear within a second.

### 5. Security notes

- The **anon key is public**. It's meant to be shipped to the browser. RLS policies in the schema stop anon clients from writing posts unless they include the `owner_token`.
- The **owner token is embedded in the bundle**, so treat it as a low-value shared secret (rotate it periodically). Because it's baked into the public JS, *every* visitor's browser actually sends it as a header on every Supabase request — the real "owner-only" gate is the app's client-side `isOwner()` check (a `sessionStorage` flag set by the sign-in modal), which hides the `/moderation` page and the "+ New" / delete buttons from everyday readers. The database itself trusts anyone who has the token, which in practice means anyone who's opened devtools on your site.
- For a hardened setup, replace the token-header approach with real Supabase Auth (magic link login as the owner) and put mutations behind Edge Functions that check a verified JWT instead of a shared string.
- The default policies allow anonymous read of published posts and approved comments, and anonymous insert of pending comments only.

---

## Content Storage

Posts are stored in the browser's **localStorage** under keys `ia_journal`, `ia_photos`, `ia_experiences`, `ia_articles`, `ia_views`. Each post has:

```json
{
  "id": "1720000000000",
  "createdAt": "2026-07-01T10:23:00.000Z",
  "title": "On starting again",
  "body": "There's a particular kind of quiet…",
  "image": "data:image/jpeg;base64,…"
}
```

Images are stored as base64 data URLs inside the post record (chosen for zero-backend simplicity). If you want a real backend later, swap the four functions in [`src/store.js`](src/store.js) — `load / save / addPost / deletePost` — to hit a REST or Firestore endpoint. The rest of the app doesn't care.

### Seed content

On the first page load, `src/seed.js` populates each section with 3–4 dummy posts (words + Unsplash photos) so the site never looks empty. Seeding is guarded by a `ia_seeded_v1` flag and never overwrites your real posts. To reset:

```js
localStorage.clear()
```

---

## Contact & Newsletter

Both forms use [FormSubmit](https://formsubmit.co) — no signup, no API keys, no backend. The recipient email is hardcoded to `ananth.machiraju@outlook.com` in:

- [`src/pages/Contact.jsx`](src/pages/Contact.jsx)
- [`src/components/Footer.jsx`](src/components/Footer.jsx)

**One-time activation:** The very first submission triggers a confirmation email from FormSubmit. Click the link once — all future messages (contact + subscribe) will arrive automatically. Each form sets `_subject` so you can filter them in your inbox:

- Contact form → `New message from I'm Ananth`
- Newsletter subscribe → `New subscriber — I'm Ananth`

---

## Design System

CSS custom properties define the palette in [`src/styles.css`](src/styles.css):

```css
:root {
  --gold:          #c8a24b;   /* nav / footer text, accents */
  --gold-deep:     #a8842f;   /* hover / emphasis */
  --titanium:      #6e7377;   /* body copy */
  --titanium-dark: #4a4f52;   /* headlines */
  --paper:         #fbfaf6;   /* warm off-white base */
  --white:         #ffffff;
  --line:          #ececec;
}
```

**Type:**
- **Cormorant Garamond 500/600/700** — headlines, hero, editorial body accents
- **Great Vibes 400** — the "Ananth" cursive wordmark in the hero
- **Inter 400/500/600** — nav, UI, body sans

**Ambient background layers** (all fixed, `z-index: -10`, non-interactive):

1. Warm paper gradient base
2. Faint 40px-pitch ruled journal lines
3. Three drifting gold aurorae (26 / 34 / 40 s loops)
4. SVG turbulence grain @ 22% opacity
5. Corner-darkening titanium vignette

---

## Customization

- **Palette** → edit CSS variables at the top of `src/styles.css`
- **Owner password** → `OWNER_PASSWORD` in `src/store.js`
- **Recipient email** → `OWNER_EMAIL` constant in `Contact.jsx` and `Footer.jsx`
- **Social links** → `SOCIALS` array in `src/components/Footer.jsx`
- **Sections** → `SECTIONS` array in `src/App.jsx` (also add matching seed data in `seed.js`)
- **Logo** → replace `public/logo.svg`
- **Signature** → replace `public/signature.png` (black-ink transparent PNG, ~800×260 recommended)
- **Newsletter recipient** → `SUBSCRIBE_ENDPOINT` in `Footer.jsx`

---

## Building for Production

```bash
npm run build
```

Outputs a static bundle to `dist/` — pure HTML/CSS/JS with no server dependency. Preview locally with:

```bash
npm run preview
```

---

## Deployment

Because it's a static SPA, any static host works. Recommended:

- **Vercel** — `vercel deploy` (auto-detects Vite)
- **Netlify** — drag `dist/` into the dashboard, or `netlify deploy --prod --dir dist`
- **GitHub Pages** — publish `dist/` on the `gh-pages` branch
- **Cloudflare Pages** — connect this repo, build command `npm run build`, output dir `dist`

For SPAs, remember to add a rewrite so unknown paths fall back to `index.html` (e.g. Netlify `_redirects`: `/*  /index.html  200`).

---

## Roadmap

### Shipped

- [x] **Comments (moderated) on articles** — readers submit via the form at the bottom of every post; comments land as *pending* in localStorage and only appear publicly once approved. Owner gets a `/moderation` queue with a red pending-count pill in the navbar.
- [x] **RSS 2.0 feed for the Journal** — "RSS" button on the Journal section opens a well-formed feed with title, link, pubDate, description, and `<category>` entries pulled from tags.
- [x] **Image gallery lightbox for the Photos section** — click any photo → full-screen dark backdrop with the image, caption, and "1 / N" counter. Keyboard nav: `Esc` closes, `←` / `→` navigate.
- [x] **Draft / publish workflow** — every post has a `status` (`draft` | `published`). Owner sees drafts with a red "DRAFT" badge and a strip banner; readers never see them, and deep-linking a draft URL as a reader shows "This post isn't published yet."
- [x] **Tag system across sections** — comma-separated tag input on the post form, gold chip UI on cards + detail pages, `?tag=<slug>` URL filter with a "Filtering by #tag · clear" bar. Also emitted as `<category>` in RSS.
- [x] **About page** — driven from a single editable `ABOUT` object with intro, family cells, work industries, skills, website card, socials, CTA, and signature.
- [x] **Rich-text editing** — contentEditable toolbar for post titles and bodies with Bold/Italic/Underline/Strike, H2/H3/Blockquote/P, ordered/unordered lists, links, and clear-format. Paste is auto-flattened to plain text and rendered HTML is passed through a whitelist sanitizer.
- [x] **Page ornaments across the site** — italic Cormorant watermark of the current page label + a gold-diamond closing flourish before the footer on every non-home page (via the shared `Page` component).

### Still open

- [ ] Optional Firebase / Supabase backend for cross-device posts
- [ ] Dark mode
- [ ] Post scheduling (publish at a future date)
- [ ] Search across all sections
- [ ] Reader-side saved / bookmarked posts
- [ ] Reactions (♥, ✦) on comments
- [ ] OG image + per-post meta tags for social sharing
- [ ] Sitemap and canonical URLs

---

## License

Personal project. All words, photographs, and views by **Ananth Machiraju**. Code available under MIT; content is All Rights Reserved.
