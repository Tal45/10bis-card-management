# Gift Card Wallet (PWA) — End-to-End Project Spec

A lightweight **offline-first** Progressive Web App that lets you store and manage gift cards in one place, generate a **scannable barcode/QR** per card, and quickly **archive/remove** cards when they’re used up.

> Target user: you (single user) on iOS/Android.  
> Goal: **open → find card → show code/barcode** in seconds.  
> Constraint: **$0/month** (no backend required for V1).

---

## 1) Product Requirements

### Core features (V1)
1. **Create card**
   - Fields:
     - **Number** (gift card code / digits / alphanumerics)
     - **Amount** (remaining balance; numeric)
     - **Expiration date** (date)
   - Optional fields (recommended):
     - **Nickname** (e.g., “Wolt 200₪”, “Café X”)
     - **Currency** (default ILS)
     - **Notes**

2. **Card list**
   - Sort:
     - Soonest expiration first (default)
     - Highest amount
     - Recently used
   - Search by nickname or number (partial match)

3. **Card detail**
   - Big “code display” + **Copy** button
   - Generated **barcode/QR** image for scanning (if useful)
   - Actions:
     - **Update amount**
     - **Mark as empty**
     - **Archive / restore**
     - **Delete (hard delete)**

4. **Swipe to archive**
   - On list: swipe a card → “Archive”
   - Archived cards are hidden by default, with a toggle “Show archived”

5. **Offline-first**
   - Must work without internet after initial load.

### Non-goals (V1)
- No scraping/automation of 10bis.
- No multi-user accounts.
- No cloud sync by default.

---

## 2) Tech Stack (Recommended)

### Frontend
- **React + TypeScript**
- Build tool: **Vite** (fast, simple)  
  Alternatives: Next.js (if you want SSR later), but Vite is perfect for a local-first PWA.

### PWA & Offline
- **Vite PWA plugin** (Workbox-based):
  - `vite-plugin-pwa`
- Service worker caching strategy:
  - App shell: **Cache-first**
  - Static assets: **Cache-first**
  - (No API calls in V1)

### Local storage (database)
- **IndexedDB** (primary storage)
- Library: **Dexie.js**
  - Easier schema, migrations, queries, indexing.

### Barcode / QR generation (client-side)
- Barcode: **Code 128** (good for “scan a code” workflows)
  - Library: `jsbarcode`
- QR Code (fallback / optional):
  - Library: `qrcode` (or `qrcode.react`)

> Note: Some merchants can’t scan certain types; supporting both barcode + QR costs almost nothing and improves compatibility.

### UI
- UI framework: **Tailwind CSS**
- Component library (optional but helps speed):
  - **shadcn/ui** (if using React + Tailwind)
  - or Mantine / MUI if you prefer

### Forms & validation
- `react-hook-form`
- `zod` for schema validation

### Date handling
- `date-fns` (lightweight)
- Input: native `<input type="date">` or a date picker component

### Testing
- Unit: **Vitest**
- UI/E2E: **Playwright** (optional for V1, recommended as you mature)

### Linting / formatting
- ESLint + TypeScript ESLint
- Prettier

### Hosting (free)
- **Cloudflare Pages** (recommended)  
  Alternatives: Vercel / Netlify / GitHub Pages.

### Optional security upgrade (still local-only)
- **Local encryption** of gift-card numbers before writing to IndexedDB:
  - Web Crypto API (AES-GCM) + user PIN-derived key (PBKDF2)
  - This adds complexity; see Section 7.

---

## 3) Project Architecture

### High-level
- Pure frontend PWA.
- All data stored locally in IndexedDB.
- No backend, no cloud storage, no paid services.

### Folder structure (suggested)
```
src/
  app/
    routes/
    components/
    hooks/
    store/
  db/
    index.ts
    schema.ts
    migrations.ts
  features/
    cards/
      CardList.tsx
      CardDetail.tsx
      CardForm.tsx
      cardTypes.ts
      cardService.ts
  utils/
    barcode.ts
    dates.ts
    currency.ts
  styles/
public/
  icons/
  manifest.webmanifest
```
---

## 4) Data Model

### Entity: Card
Fields (required by your spec):
- `number: string`  
- `amount: number` (store as integer “agorot” or decimal? see below)
- `expirationDate: string` (ISO `YYYY-MM-DD`)

Recommended additional fields:
- `id: string` (UUID)
- `nickname: string`
- `currency: "ILS" | "USD" | ...` (default `"ILS"`)
- `createdAt: string` (ISO datetime)
- `updatedAt: string` (ISO datetime)
- `archivedAt?: string` (ISO datetime | null)
- `lastUsedAt?: string`
- `isEmpty: boolean` (or derived from amount == 0)

#### Amount precision
To avoid floating bugs:
- Store money as **integer minor units**:
  - ILS: store agorot → `amountMinor = 12345` for 123.45₪
- Display as `amountMinor / 100`.

### IndexedDB (Dexie) schema
- Table: `cards`
  - Primary key: `id`
  - Indexes:
    - `expirationDate`
    - `archivedAt`
    - `lastUsedAt`
    - `nickname`
    - `amountMinor`

### Entity: CardEvent (optional but useful)
Tracks usage history.
- `id`
- `cardId`
- `type: "CREATE" | "UPDATE_AMOUNT" | "ARCHIVE" | "RESTORE" | "DELETE" | "MARK_EMPTY"`
- `deltaAmountMinor?: number`
- `createdAt`

This enables “recently used” sorting and audit trail.

---

## 5) UI/UX Spec (Screens & Flows)

### 5.1 Home / Card List
**Must be fast**:
- Search bar at top
- List of active (non-archived) cards
- Each row shows:
  - Nickname (or masked number)
  - Amount
  - Expiration status (e.g., “Expires in 12 days”)
- Swipe actions:
  - Swipe left: Archive
  - Swipe right (optional): Quick edit amount

Empty-state:
- If no cards: show CTA “Add your first card”

Toggle:
- “Show archived” switch or tab

### 5.2 Add/Edit Card
Fields:
- Number (text)
- Amount (number)
- Expiration date (date picker)
- Nickname (optional)
Buttons:
- Save
- Cancel

Validation:
- Number required, min length (e.g., 4)
- Amount >= 0
- Expiration date valid (not required? you want required — keep required)
- Prevent duplicates (warn if same number already exists)

### 5.3 Card Detail
Top area:
- Nickname + expiration + amount
Main area:
- Large code display (monospace)
- Buttons:
  - Copy number
  - Reveal/hide number (optional “privacy”)
Barcode area:
- Code128 barcode (generated from `number`)
- QR fallback
Actions:
- Update amount (dialog)
- Mark empty (sets amount to 0 + isEmpty)
- Archive
- Delete

### 5.4 Archive & Remove
- Archive is soft-delete (reversible)
- Delete is permanent; prompt confirm

---

## 6) Barcode / QR Strategy

Because different cashiers/terminals behave differently:
- Generate **Code128** barcode from the card `number`
- Also generate **QR code** from the same `number`

Display both in Card Detail (with a toggle).

### Practical rules
- If `number` is too long for barcode (rare), prefer QR.
- If code has unsupported characters for Code128 library, sanitize or fallback to QR.

---

## 7) Security & Privacy Plan

### Baseline (V1)
- Data stored in IndexedDB.
- Protection relies on device lock.
- Add a “Hide number by default” option in settings.

### Recommended upgrade (V1.5): PIN lock + encryption
Goal: If someone opens your phone while unlocked, they still can’t easily read your gift card numbers.

Approach:
1. User sets a **PIN**.
2. Derive key from PIN using **PBKDF2** (Web Crypto API).
3. Encrypt card numbers with **AES-GCM** before storing.
4. Store:
   - `encryptedNumber`
   - `iv`
   - `salt`
5. Decrypt only in-memory after PIN unlock.
6. Auto-lock after X minutes idle.

Tradeoff:
- More complexity, but still fully client-only and $0/month.

---

## 8) Backup & Restore (Highly recommended)

To avoid losing cards if Safari data is cleared / device lost:

### Export
- Generate an encrypted JSON file:
  - Contains all cards and events
  - Encrypted with a user-supplied passphrase (AES-GCM)
- Download file; user can put it in iCloud Drive manually.

### Import
- Upload the export file
- Enter passphrase
- Merge or replace local DB

This gives you “sync-like safety” without any server.

---

## 9) Build & Deployment

### Local dev
- `pnpm install`
- `pnpm dev`

### Production build
- `pnpm build`
- `pnpm preview`

### Deploy (Cloudflare Pages)
- Connect GitHub repo
- Build command: `pnpm build`
- Output: `dist`
- Enable HTTPS (default)
- Configure PWA icons + manifest

### PWA install (iOS)
- Open site in Safari
- Share → “Add to Home Screen”

---

## 10) Step-by-step Implementation Plan (Milestones)

### Milestone 1 — Skeleton + PWA shell (0.5 day)
- Vite + React + TS
- Tailwind
- PWA plugin with manifest + icons
- Basic routing

### Milestone 2 — Local DB (0.5–1 day)
- Dexie setup
- `cards` table schema
- CRUD functions

### Milestone 3 — Core UI (1–2 days)
- Card list + search
- Add/edit form (validation)
- Card detail screen

### Milestone 4 — Barcode/QR (0.5 day)
- Code128 render component
- QR render component
- Toggle and layout

### Milestone 5 — Archive/empty workflows (0.5–1 day)
- Swipe/inline actions
- Archived view
- Mark empty

### Milestone 6 — Backup/restore (1 day)
- Export encrypted JSON
- Import + merge strategy

### Milestone 7 — Polish (ongoing)
- Better sorting, “expiring soon” badges
- Settings screen (hide number, default currency)
- Basic E2E tests (Playwright)

---

## 11) Acceptance Criteria (Done = ship)

- [ ] Add a card with number/amount/expiration and it appears in list immediately.
- [ ] Works offline after first load.
- [ ] Card detail shows large code and at least one scannable format (barcode or QR).
- [ ] Copy button copies the number.
- [ ] Archive hides card; archived list allows restore.
- [ ] Mark empty sets amount to 0 and can optionally auto-archive.
- [ ] Export + Import restores all cards on another device/browser.
- [ ] UI is fast on iPhone (home-screen installed PWA).

---

## 12) Suggested Enhancements (Later)

### Smart reminders
- “Expiring in 7 days” banner
- Optional notification scheduling (may require more PWA permissions)

### Card templates
- Quick-add preset: currency, nickname pattern

### OCR / scan code
- Use camera to scan printed code/QR and auto-fill number
- (More complex; consider after V1)

### Optional cloud sync (only if you want it)
- Supabase:
  - Auth (email or magic link)
  - Encrypted data payload storage
- Still keep client-side encryption so server never sees raw codes

---

## 13) Package List (Concrete)

**Core**
- react, react-dom, typescript
- vite
- vite-plugin-pwa
- dexie
- react-router-dom (or TanStack Router)

**UI**
- tailwindcss
- react-hook-form
- zod
- date-fns

**Barcode**
- jsbarcode
- qrcode (or qrcode.react)

**Quality**
- vitest
- eslint + prettier

---

## 14) Notes specific to your use case (10bis gift cards)
- You’re building a **personal wallet** for codes, not an automation/scraper.
- The value is **discoverability + speed**, not integration.
- Avoid ToS-risky scraping; manual entry is stable and maintainable.

---

## 15) Next Actions (To “make this project a go”)
1. Initialize repo with Vite + TS + Tailwind + PWA plugin.
2. Implement Dexie schema and CRUD service.
3. Build 3 screens: List, Form, Detail.
4. Add barcode/QR rendering.
5. Add archive + mark empty.
6. Add export/import.

If you want, I can also produce:
- a ready-to-run repo skeleton (files + package.json + PWA manifest),
- a Dexie schema + TypeScript types,
- and the initial UI components for the 3 screens.
