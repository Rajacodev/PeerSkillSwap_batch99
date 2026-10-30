# PeerSkillSwap — Frontend

The React client for PeerSkillSwap, a credit-based peer-to-peer skill
exchange platform. Built with Vite, Material UI, React Router, React Hook
Form, and Axios, and wired directly against the Flask backend from Session 1.

## Tech Stack

- **Framework:** React 18 + Vite 5
- **UI:** Material UI (MUI) v6, with a custom light/dark theme
- **Routing:** React Router v6
- **Forms:** React Hook Form
- **HTTP:** Axios, with an interceptor that auto-refreshes expired JWTs
- **Notifications:** notistack (toast messages)

## Folder Structure

```
Frontend/
├── index.html
├── vite.config.js
├── .env.example
├── src/
│   ├── main.jsx              # Entrypoint — wires up all providers
│   ├── App.jsx                # Route definitions
│   ├── theme.js                # Custom MUI theme (light + dark palettes)
│   ├── index.css
│   ├── layouts/
│   │   ├── MainLayout.jsx       # Navbar + Sidebar + Footer shell
│   │   └── AuthLayout.jsx       # Centered card shell for login/register
│   ├── pages/                   # One file per route (see below)
│   ├── components/
│   │   ├── common/               # LoadingSpinner, EmptyState, PaginationBar,
│   │   │                         # CreditBadge, RatingStars, StatusChip,
│   │   │                         # UserAvatar, ProtectedRoute
│   │   ├── layout/                # Navbar, Sidebar, Footer
│   │   ├── skills/                 # SkillCard, SkillFilters, SkillFormDialog
│   │   ├── bookings/                # BookingCard, BookingRequestDialog
│   │   └── reviews/                  # ReviewDialog
│   ├── context/                  # AuthContext, ThemeModeContext, ConfirmDialogContext
│   ├── hooks/                     # useAuth, useThemeMode, useConfirm, useDebounce
│   ├── services/                   # One Axios wrapper per backend module
│   └── utils/                       # formatters, constants, error-message helper
```

## Pages

Landing · Login · Register · Forgot/Reset Password · Dashboard · Profile ·
Edit Profile · Browse Skills · Skill Details · My Skills (mentor) · Bookmarks ·
Bookings · Wallet · Notifications · Leaderboard · Achievements ·
Admin Dashboard · 404

## Getting Started

### 1. Prerequisites
- Node.js 18+
- The **Backend** from Session 1 running locally (default `http://localhost:5000`)

### 2. Install dependencies

```bash
cd Frontend
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

By default this points to `http://localhost:5000/api`. Update
`VITE_API_BASE_URL` if your backend runs elsewhere.

### 4. Run the dev server

```bash
npm run dev
```

The app is available at `http://localhost:5173`.

### 5. Build for production

```bash
npm run build
npm run preview   # optional local preview of the production build
```

Output goes to `dist/`.

## AI Career Advisor

`/career-advisor` (also linked from a promo card on the Dashboard): type in
a target job title and get a short overview plus a prioritized list of
skills to learn. Each recommended skill is cross-checked against the
platform's own listings; if a mentor already teaches it, it appears as a
bookable `SkillCard`. Past searches are saved in an expandable history list.

The page shows which AI engines the backend has configured (Claude,
ChatGPT, Gemini, Llama via Groq) and, for each result, which one produced
it, or that it came from the curated fallback dataset. Past searches show
the same label.


## Navigation

There is **no sidebar** — all navigation lives in the top bar so pages are
always one click away without a persistent side panel eating into content
width:

- **Desktop (`md` and up):** a horizontal pill navigation
  (`components/layout/NavPills.jsx`) sits inline in the navbar. The active
  route is highlighted with a filled gradient pill; others are plain text
  that lights up on hover. It scrolls horizontally rather than wrapping if
  the window is narrow.
- **Mobile / tablet:** the same links collapse into a single hamburger
  icon that opens a dropdown menu (not a drawer) — tap it, pick a page, it
  closes itself.
- Role-based items (`My Skills` for mentors, `Admin` for admins) are
  injected automatically via `getFullNavItems(user)` in `NavPills.jsx`.

## Reliability

- A route-scoped `ErrorBoundary` wraps every page (keyed by pathname in
  `MainLayout`), plus a top-level one in `main.jsx`. If a page throws during
  render, the user sees a friendly "Something went wrong" screen with a way
  back to the dashboard — never a blank white page — and the error is logged
  to the console for debugging.
- Data-fetching effects that populate page-level state (e.g. `Dashboard`,
  `AdminDashboard`) now properly `catch` failed requests and show an error
  `Alert` instead of crashing when trying to read data that never arrived.

## Interaction & Motion

- Cards (skills, bookings, stats) lift and gain elevation on hover via a
  shared theme-level transition, with a gradient accent bar that sweeps in
  under the cursor on `SkillCard`.
- Buttons, icon buttons, chips, and list items have subtle hover/active
  micro-interactions (lift, scale, padding shift) defined once in `theme.js`
  so they're consistent everywhere.
- Route changes fade in via `PageTransition` rather than snapping instantly.
- The landing page's "how it works" cards enter with a staggered `Grow`
  animation and tilt their icon on hover; the hero's orbiting skill-icon ring
  keeps a slow continuous rotation.
- Skeleton loading placeholders (not just spinners) are used on `Browse
  Skills` and the `Dashboard` for a more responsive, engaging loading feel.

## Design Notes

- **Palette:** a deep teal (`#0F5257`) paired with a warm clay-orange
  (`#E8874A`) — deliberately not the default MUI blue/purple — to evoke trust
  and the "exchange" economy at the platform's core.
- **Typography:** Space Grotesk for headings, Inter for body text.
- **Signature element:** the circular "credit coin" badge
  (`CreditBadge` component) appears everywhere credits are shown — skill
  cards, bookings, the wallet — reinforcing skills-as-currency as the visual
  throughline of the app. The landing page hero uses the same motif as an
  orbiting ring of skill icons around a central swap icon.
- **Dark mode** is available via the moon/sun toggle in the navbar and
  persists across sessions (stored in `localStorage`).

## Auth Flow

- On login/register, the backend's `access_token` and `refresh_token` are
  stored in `localStorage`.
- Every request attaches `Authorization: Bearer <access_token>`.
- On a `401`, the Axios interceptor automatically calls `/auth/refresh` once,
  retries the original request, and only redirects to `/login` if the
  refresh itself fails — so short-lived access tokens never interrupt the
  user mid-session.

## Role-Based UI

- **Student:** browse/book skills, manage bookings, wallet, reviews.
- **Mentor:** everything a student can do, plus "My Skills" (create/edit/
  deactivate listings) and the mentor-side booking queue (accept/reject/
  complete).
- **Admin:** all of the above, plus `/admin` — platform analytics and
  moderation tools for users, skills, and bookings.

`ProtectedRoute` (in `components/common/`) guards authenticated routes and
accepts an optional `allowedRoles` prop for role-gated pages like
`/skills/mine` and `/admin`.

## Verified

- `npm install` completes cleanly against the pinned `package.json`.
- `npm run build` produces a working production bundle with no errors.
- `npx eslint src` passes with zero errors.
- `npm run dev` serves the app and responds with HTTP 200.

## Video Calls

Once a booking is `accepted`, either participant can open **Start Video Call**
on the booking card (`/bookings/:bookingId/call`). The call room is full screen
and includes:

- camera and microphone video, mute and camera toggles
- screen sharing, which swaps the camera track for the screen and switches back
  when sharing stops (including the browser's own "Stop sharing" button)
- an in-call text chat drawer

It is built on native `RTCPeerConnection` (`hooks/useVideoCall.js`), with no
third-party call SDK. Signalling goes through `socket.io-client`. The hook waits
for its socket after an async step, so React StrictMode never opens a duplicate
connection. Camera and microphone access needs HTTPS outside `localhost`.

## Configuration and deployment

No API address is hard-coded. The app calls `/api` on the origin it was loaded from:

- **Development:** `npm run dev` serves the app on port 5173. Vite forwards
  `/api`, `/uploads` and `/socket.io` (WebSockets included) to the backend
  at `VITE_DEV_API_TARGET` (default `http://localhost:5000`). Because the
  browser only talks to the Vite server, the app also works from another
  device on the same network.
- **Production (Docker):** the image builds the static site and serves it with
  nginx (`nginx.conf`), which forwards API, upload and WebSocket traffic to the
  backend container. See `Backend/DEPLOYMENT.md`.
- Set `VITE_API_BASE_URL` and `VITE_SOCKET_URL` only if the API is on a
  different domain. These values are fixed at build time.

