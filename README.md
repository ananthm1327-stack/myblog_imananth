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
   export const OWNER_PASSWORD = 'ananth2026'
   ```
   **Change this before deploying.** The password is a client-side gate — anyone determined enough to look at the bundle can find it. It's intended to keep casual readers from posting, not to protect against a real attacker.
3. Once signed in, a **+ New** button appears in each section and delete buttons appear on cards + post detail pages.
4. **Sign Out** appears in the navbar; auth is stored in `sessionStorage` so it clears when you close the tab.

Readers do not need to sign in — everything is browsable freely.

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

Ideas for future iterations:

- [ ] Optional Firebase / Supabase backend for cross-device posts
- [ ] Comments (moderated) on articles
- [ ] RSS feed for the Journal
- [ ] Dark mode
- [ ] Image gallery lightbox for the Photos section
- [ ] Draft / publish workflow
- [ ] Tag system across sections

---

## License

Personal project. All words, photographs, and views by **Ananth Machiraju**. Code available under MIT; content is All Rights Reserved.
