# I'm Ananth

> A quiet corner of the internet — a personal editorial blog for **journals**, **photographs**, **lived experiences**, **articles**, and honest **views** on the world.

Live at **[iamananth.blog](https://iamananth.blog)**.

Built with React + Vite + Firebase. Editorial gold-on-paper aesthetic. Owner-only publishing with cross-device sync, moderated comments, on-page rich-text + HTML + Markdown editing, live sitemap, and no ongoing infrastructure to babysit.

Contact inbox: `ananth.machiraju@outlook.com`

---

## Table of Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [Owner sign-in](#owner-sign-in)
- [Firebase backend](#firebase-backend)
- [Contact & newsletter](#contact--newsletter)
- [SEO](#seo)
- [Design system](#design-system)
- [Customization](#customization)
- [Building for production](#building-for-production)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

**Reading**
- **Five content sections** — Journal, Photos, Experiences, Articles, Views — each with its own list page and per-post detail page
- **Daily quote** on the homepage, one of 365 original short reflections that cycles by day-of-year, so every visitor sees the same line on the same day
- **Comments (moderated)** — anyone can leave one; only approved comments are public; comment reactions (♥/✦) are per-browser
- **Bookmarks** — a per-browser saved-for-later list at `/bookmarks`
- **Search overlay** — `/` or `Ctrl+K` opens a full-site search across titles, bodies, and tags
- **Tags** — every post can carry tags; each tag chip filters the section it belongs to
- **RSS feed** for the Journal section
- **Lightbox** for the Photos grid with keyboard navigation

**Publishing (owner only)**
- **Password-gated sign-in** — one owner, no user accounts
- **Rich-text editor** with a WYSIWYG toolbar, a raw `<HTML>` source mode, and a Markdown paste-and-convert panel — all three produce the same sanitized HTML underneath
- **Draft / publish workflow** with visible DRAFT badges for the owner
- **Scheduled publishing** — pick a future datetime and it goes live on its own
- **Cross-device sync** — anything posted from one device shows up on every other device within seconds via Firestore `onSnapshot` listeners (no polling; SDK handles reconnect natively)
- **Photo uploads go straight to Firebase Storage** — post rows carry short download URLs, not multi-MB base64 blobs
- **Delete-and-forget** — deleting a post also frees its Storage object

**Design & polish**
- **Editorial atmosphere** — a fixed background layer with a paper gradient, drifting gold aurorae, a rotating compass seal peeking in from the right, faint italic script watermarks in the margins, a twinkling diamond constellation, and a journal-margin rule
- **Custom gold cursor** on pointer devices (native text caret preserved in form fields)
- **Gold click-spark micro-interaction** on every click
- **Preloader** during React boot so first paint is elegant, not blank
- **Themed toast notifications** and a cookie-consent banner
- **Full responsive design** — dedicated breakpoints for wide desktop, laptop, tablet, phone, and small phone
- **Mobile drawer nav** with an in-drawer search entry
- **Accessibility** — `prefers-reduced-motion` respected on every animation, ARIA labels on icon buttons, ≥44px touch targets, focus rings preserved
- **Legal pages** — Privacy Policy, Disclaimer, Terms & Conditions

---

## Tech stack

| Layer          | Choice                                                    | Reason                                                                 |
|----------------|-----------------------------------------------------------|------------------------------------------------------------------------|
| Framework      | React 18                                                  | Component composition + declarative routing                            |
| Bundler        | Vite 5                                                    | Instant HMR, fast production builds                                    |
| Routing        | react-router-dom 6                                        | Nested routes for sections + detail views                              |
| Backend        | [Firebase](https://firebase.google.com) (Firestore + Storage) | Real-time onSnapshot for cross-device sync; no server code to run    |
| Forms          | [FormSubmit](https://formsubmit.co)                       | Contact & newsletter → inbox, no signup                                |
| Markdown       | [`marked`](https://github.com/markedjs/marked)            | Parses the Markdown-import mode in the editor                          |
| Typography     | Cormorant Garamond, Great Vibes, Inter                    | Editorial serif + script + neutral sans                                |
| Icons          | Inline SVG only                                           | No icon library dependency                                             |
| Styling        | Vanilla CSS (single `styles.css`, CSS custom properties)  | Small, direct, easy to hack                                            |
| Hosting        | Vercel (SPA rewrite in `vercel.json` + one serverless fn) | Auto-detects Vite; the fn serves a live `/sitemap.xml`                 |

---

## Quick start

**Prerequisites:** Node 18+ and npm.

```bash
git clone https://github.com/ananthm1327-stack/myblog_imananth.git
cd myblog_imananth
npm install
npm run dev
```

Open **http://localhost:5173**. Without Firebase configured, the site runs against local demo content.

To wire in the real backend, see [Firebase backend](#firebase-backend) below.

### Available scripts

| Command           | What it does                                    |
|-------------------|-------------------------------------------------|
| `npm run dev`     | Vite dev server with HMR on port 5173           |
| `npm run build`   | Build production bundle to `dist/`              |
| `npm run preview` | Serve the built `dist/` locally                 |

---

## Project structure

```
myblog_imananth/
├── public/
│   ├── logo.svg              # Hand-drawn "A" monogram (also the favicon)
│   ├── signature.png         # Ananth's signature (tinted gold via CSS mask)
│   ├── robots.txt            # Points crawlers at /sitemap.xml
│   └── fonts/
├── api/
│   └── sitemap.js            # Vercel serverless fn — live /sitemap.xml
├── scripts/
│   └── migrate-supabase-to-firebase.mjs  # One-off, copies data + images across
├── firebase/
│   ├── firestore.rules       # Public read + owner-only write via shared token
│   └── storage.rules         # Same model for the post-images/ bucket
├── firebase.json             # Points the Firebase CLI at the two rule files
├── src/
│   ├── main.jsx              # React entry — boots the sync stack
│   ├── App.jsx               # Router, navbar, drawer, sign-in modal, overlays
│   ├── styles.css            # All styling (single source of truth)
│   ├── store.js              # Content model + owner auth + sitemap/RSS builders
│   ├── seed.js               # Local-only demo content (used when Firebase is off)
│   ├── components/
│   │   ├── Footer.jsx        # 3-column footer + legal-link row
│   │   ├── Meta.jsx          # Per-page title / OG / Twitter / JSON-LD / canonical
│   │   ├── DailyQuote.jsx    # Homepage quote-of-the-day band
│   │   ├── ClickSpark.jsx    # Gold spark burst on every click
│   │   ├── CookieConsent.jsx # Bottom banner, one-time
│   │   ├── EmptyState.jsx    # "Nothing here" vs "couldn't load — Retry"
│   │   ├── Lightbox.jsx      # Photos grid full-screen viewer (portaled)
│   │   ├── Preloader.jsx     # Boot-screen shown until React mounts
│   │   ├── RichText.jsx      # WYSIWYG + HTML source + Markdown import editor
│   │   ├── ToastHost.jsx     # Toast notification stack
│   │   ├── SearchOverlay.jsx # / and Ctrl+K search overlay
│   │   └── Comments.jsx      # Per-post comment thread + reactions
│   ├── pages/
│   │   ├── Home.jsx          # Hero + DailyQuote + 3-item preview per section
│   │   ├── Section.jsx       # Section listing + owner PostForm modal
│   │   ├── PostDetail.jsx    # Full post + JSON-LD BlogPosting + comments
│   │   ├── About.jsx         # Data-driven About page
│   │   ├── Contact.jsx       # FormSubmit-backed contact form
│   │   ├── Bookmarks.jsx     # Per-browser saved list (noindex)
│   │   ├── Moderation.jsx    # Owner-only comment approval queue (noindex)
│   │   └── Legal.jsx         # Privacy / Disclaimer / Terms — one component, three routes
│   └── lib/
│       ├── firebase.js       # Configured Firestore + Storage client
│       ├── sync.js           # pullAll, realtime, poll, retry, lifecycle
│       ├── storage.js        # Image upload / delete helpers
│       ├── bus.js            # Tiny pub/sub so pages re-render on data change
│       ├── toast.js          # Toast API
│       ├── sanitize.js       # HTML whitelist sanitizer
│       ├── quotes.js         # 365 daily quotes + day-of-year picker
│       └── jsonld.js         # schema.org JSON-LD builders
├── index.html                # Root HTML with fonts + base OG tags + canonical
├── vercel.json               # Rewrites: /sitemap.xml → /api/sitemap, SPA catch-all
└── package.json
```

---

## Owner sign-in

Publishing is restricted so only Ananth can add or delete posts.

1. Click **Sign In** in the navbar → the restricted-access modal appears.
2. Enter the owner password. Default is set in [`src/store.js`](src/store.js): `OWNER_PASSWORD`. **Change this before deploying.** It's a client-side gate — anyone determined enough can read it from the bundle. It keeps casual readers from posting, not a real attacker.
3. Signed in, **+ New** buttons appear on each section, and Edit / Publish / Delete controls appear on cards, photos, and post detail pages.
4. Auth is stored in `sessionStorage` and clears when the tab closes.

Readers never need to sign in — everything is browsable freely.

---

## Firebase backend

Once configured, Firebase (Firestore + Storage) is the single source of truth for posts, comments, and photo uploads. Without it, the app falls back to local demo mode using `seed.js`.

### 1. Create the project

1. In the [Firebase console](https://console.firebase.google.com), create a new project.
2. Enable **Firestore Database** (production mode).
3. Enable **Firebase Storage**.
4. Project Settings → Your apps → Add a **Web app** → copy the config object (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).

### 2. Configure the client

```bash
cp .env.example .env.local
```

Then edit `.env.local` with the values from step 1 plus a shared owner token:

```ini
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=YOUR-PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR-PROJECT
VITE_FIREBASE_STORAGE_BUCKET=YOUR-PROJECT.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_OWNER_TOKEN=a-40-plus-character-random-string
```

### 3. Deploy security rules

Open [`firebase/firestore.rules`](firebase/firestore.rules) and [`firebase/storage.rules`](firebase/storage.rules). Both files have a placeholder line:

```
return 'PASTE_YOUR_OWNER_TOKEN_HERE';
```

Replace with the actual value of `VITE_OWNER_TOKEN`. Then deploy either via the Firebase console (paste the rules under Firestore / Storage → Rules → Publish) or via the CLI:

```bash
npx firebase-tools deploy --only firestore:rules,storage
```

### 4. How sync works

- **`subscribeAll()`** in [`src/lib/sync.js`](src/lib/sync.js) opens two Firestore `onSnapshot` listeners at boot — one on `posts`, one on `comments`. Every insert, update, or delete anywhere in either collection delivers just the changed docs to the client, and the local mirror in `localStorage` is rebuilt so all pages re-render automatically. No polling, no debounce, no reconnect timer — the SDK handles all of that natively.
- **Writes are fire-and-forget mirrors.** The local write completes instantly (UI stays snappy); the mirror to Firestore happens right after. Push failures toast an error to the owner so a silent drift never happens.
- **Image uploads** go straight to Firebase Storage under the `post-images/<section>/` prefix. The post row carries a short download URL (~150 bytes), not the image bytes. Deleting a post also removes its Storage object.
- **`EmptyState`** shows a real "couldn't load — Retry" message when a listener errors, so a network hiccup never looks like an empty section.
- **Reader-only state stays local** by design — bookmarks and "have I reacted?" flags never sync.

### 5. Security notes

- The **Firebase web API key is public** — it's meant to ship to the browser. Firestore Security Rules are what actually gate writes.
- The **owner token is embedded in the bundle** AND compiled into the deployed Security Rules. Treat it as a low-value shared secret and rotate it periodically. The real "owner-only" UX gate is the client-side `isOwner()` check, which hides the `/moderation` page and every owner control from readers. The database trusts anyone who has the token.
- For a hardened setup, replace the token pattern with real Firebase Auth (email/password or magic link) and change the rules to check `request.auth.uid == 'YOUR-OWNER-UID'`.
- Default rules: anonymous read of published posts and approved comments; anonymous create of pending comments; owner-only write for posts, comment moderation, and Storage objects.

### 6. Migrating from Supabase

If you're upgrading from the old Supabase-backed version, keep both sets of env vars in `.env.local` temporarily and run:

```bash
node scripts/migrate-supabase-to-firebase.mjs --dry-run   # preview
node scripts/migrate-supabase-to-firebase.mjs             # actually copy
```

It downloads every post, comment, and Storage image from Supabase and writes them into Firestore + Firebase Storage, rewriting each post's `image` URL to point at the new bucket. Safe to re-run — skips docs whose id already exists in Firestore.

---

## Contact & newsletter

Both forms use [FormSubmit](https://formsubmit.co) — no signup, no API keys, no backend of my own. The recipient email is hardcoded to `ananth.machiraju@outlook.com` in:

- [`src/pages/Contact.jsx`](src/pages/Contact.jsx)
- [`src/components/Footer.jsx`](src/components/Footer.jsx)

**One-time activation:** The first submission triggers a confirmation email from FormSubmit. Click the link once and all future contact + subscribe submissions arrive automatically.

Each form sets `_subject` so they're easy to filter:

- Contact → `New message from I'm Ananth`
- Newsletter subscribe → `New subscriber — I'm Ananth`

---

## SEO

- **Per-page `<Meta>`** on every route sets `<title>`, meta description, canonical, Open Graph, Twitter Card, and Robots tags.
- **JSON-LD structured data** — a `WebSite` + `Person` graph on the homepage; a full `BlogPosting` schema on every post detail page.
- **Baseline OG/Twitter/canonical tags in the static `index.html`** so non-JS crawlers (many link-preview bots) still get correct metadata.
- **Single `<h1>` per page** — the SEO pass fixed the pages that were `<h2>`-only.
- **Descriptive `alt` text** on every content image.
- **`noindex`** on `/bookmarks`, `/moderation`, and error/unpublished states so private or throwaway pages don't get indexed.
- **`public/robots.txt`** points crawlers at `/sitemap.xml`.
- **Live `/sitemap.xml`** — served by [`api/sitemap.js`](api/sitemap.js), a Vercel serverless function that queries Firestore via its REST API at request time. Because content is added live (no redeploy) the sitemap is always current, unlike a build-time file.

---

## Design system

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
- Cormorant Garamond 500 / 600 / 700 — headlines, hero, editorial body accents
- Great Vibes 400 — the "Ananth" cursive wordmark in the hero
- Inter 400 / 500 / 600 — nav, UI, body sans

**Background stack** (all fixed to viewport, `z-index: -10`, non-interactive):

1. Paper gradient base
2. Faint 40px-pitch ruled journal lines
3. Vertical journal margin rule
4. Three drifting gold aurorae (26 / 34 / 40 s loops)
5. Italic serif script watermarks in the corners
6. Constellation of twelve twinkling gold diamonds
7. Ornate compass seal peeking in from the right (slow 3-minute rotation)
8. SVG turbulence grain
9. Corner-darkening vignette

All ornament respects `prefers-reduced-motion` and scales / hides appropriately at narrow viewports so the mobile layout stays clean.

---

## Customization

- **Palette** → the CSS variables at the top of `src/styles.css`
- **Owner password** → `OWNER_PASSWORD` in `src/store.js`
- **Recipient email** → `OWNER_EMAIL` constant in `Contact.jsx` and `Footer.jsx`
- **Social links** → `SOCIALS` array in `src/components/Footer.jsx`
- **Sections** → `SECTIONS` array in `src/App.jsx` (also add matching seed data in `seed.js` and a description in `Section.jsx`'s `SECTION_DESCRIPTIONS`)
- **Daily quotes** → the `QUOTES` array in `src/lib/quotes.js`
- **About page copy** → the `ABOUT` object in `src/pages/About.jsx`
- **Legal copy** → the `CONTENT` object in `src/pages/Legal.jsx`
- **Logo** → replace `public/logo.svg`
- **Signature** → replace `public/signature.png`
- **Newsletter recipient** → `SUBSCRIBE_ENDPOINT` in `Footer.jsx`

---

## Building for production

```bash
npm run build
```

Outputs a static bundle to `dist/`. Preview locally with:

```bash
npm run preview
```

---

## Deployment

The site runs on **Vercel** — auto-detects Vite, serves the SPA, and runs `api/sitemap.js` as a serverless function. `vercel.json` handles the SPA rewrite plus the `/sitemap.xml → /api/sitemap` route.

For production, set the seven env vars from `.env.local` as project settings on the host:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_OWNER_TOKEN`

Any static host that supports serverless functions works too — Cloudflare Pages, Netlify, etc.

---

## Roadmap

### Shipped

- [x] Comments (moderated) on every post
- [x] RSS 2.0 feed for the Journal
- [x] Photos lightbox with keyboard navigation
- [x] Draft / publish workflow
- [x] Post scheduling
- [x] Tag system across sections
- [x] About page
- [x] Rich-text editor with WYSIWYG toolbar, raw HTML source mode, and Markdown import
- [x] Page ornaments across the site (numeral rail, section watermarks, closing flourish)
- [x] Firebase backend (Firestore + Storage) for cross-device sync
- [x] Photo uploads via cloud object storage (with a one-off base64 → Storage migration)
- [x] Resilient sync — retry with backoff, reconnect / visibility re-pull, visible failure state
- [x] Search overlay across all sections (`/` or `Ctrl+K`)
- [x] Reader-side bookmarks
- [x] Reactions (♥ / ✦) on comments
- [x] Full per-page SEO — Meta / OG / Twitter / JSON-LD (`WebSite` + `Person`, `BlogPosting`) / canonical
- [x] Live `/sitemap.xml` served by a Vercel serverless function that queries the backend at request time
- [x] Daily quote on the homepage (365 unique quotes, cycles yearly)
- [x] Custom gold cursor + click-spark micro-interaction
- [x] Cookie-consent banner, preloader, and themed toast notifications
- [x] Privacy Policy, Disclaimer, Terms & Conditions

### Still open

- [ ] Dark mode
- [ ] Newsletter archive page — a rendered index of every issue sent
- [ ] Real Firebase Auth (magic link or email/password) instead of the shared owner token

---

## License

Personal project. All words, photographs, and views by **Ananth Machiraju**. Code available under MIT; content is All Rights Reserved.
