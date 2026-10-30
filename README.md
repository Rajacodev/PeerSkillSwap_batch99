# 🚀 PeerSkillSwap

> A Credit-Based Peer-to-Peer Skill Exchange Platform built with Spring Boot, React, and MongoDB.

![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.x-green)
![React](https://img.shields.io/badge/React-19-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen)
![JWT](https://img.shields.io/badge/JWT-Authentication-red)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📖 About the Project

PeerSkillSwap is a full-stack web application that enables users to teach skills, learn new skills, and earn credits through peer-to-peer knowledge sharing.

Instead of paying with money, users earn **Skill Credits** by teaching others and spend those credits to learn from different mentors.

The platform provides secure authentication, skill management, booking, and a modern responsive user interface.

---

## ✨ Features

- 🔐 JWT Authentication & Authorization
- 👤 User Registration & Login
- 🎯 User Profile Management
- 📚 Add, Edit & Delete Skills
- 🔍 Browse Available Skills
- 🤝 Peer-to-Peer Skill Exchange
- 📅 Session Booking
- 💳 Credit Wallet System
- ⭐ Ratings & Reviews
- 📱 Responsive UI using Material UI
- 🌐 RESTful APIs
- 🔒 Secure Backend with Spring Security

---

## 🛠 Tech Stack

### Frontend

- React
- Vite
- Material UI
- React Router
- Axios

### Backend

- Java 21
- Spring Boot
- Spring Security
- JWT Authentication
- Maven

### Database

- MongoDB

### Tools

- Git
- GitHub
- Postman
- VS Code

---

## 📂 Project Structure

```
PeerSkillSwap
│
├── Backend
│   ├── src
│   ├── pom.xml
│   └── ...
│
├── Frontend
│   ├── src
│   ├── public
│   ├── package.json
│   └── ...
│
└── README.md
```

---

## 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/Rajacodev/PeerSkillSwap.git
```

---

## Backend Setup


# PeerSkillSwap — Backend

A credit-based peer-to-peer skill exchange platform. Users teach skills to earn
credits, then spend those credits to book sessions with other mentors — no
money changes hands.

This is the **Backend** service: a Flask + MongoDB (MongoEngine) REST API with
JWT auth, role-based authorization, Swagger docs, and a clean layered
architecture (routes → service → repository).

## Tech Stack

- **Framework:** Flask 3, Python 3.12+
- **Database:** MongoDB (Atlas or local), via MongoEngine
- **Auth:** JWT (Flask-JWT-Extended) + Flask-Bcrypt password hashing
- **Validation:** Marshmallow
- **Docs:** Swagger UI via Flasgger (`/apidocs/`)
- **Other:** Flask-CORS, python-dotenv, Gunicorn

## Architecture

```
Backend/
├── app.py                   # Entrypoint
├── config.py                 # Environment-based configuration
├── requirements.txt
├── .env.example
├── seed_data.py               # Sample data seeder
├── app/
│   ├── __init__.py            # App factory, blueprint + error registration
│   ├── extensions.py          # bcrypt, jwt, cors, swagger, mongo connection
│   ├── auth/                  # register, login, logout, refresh, forgot/reset password
│   ├── users/                 # profile, edit profile, upload picture, mentors list
│   ├── skills/                # skill CRUD, search/filter/sort, trending, recommended, bookmarks
│   ├── bookings/              # session request/accept/reject/complete/cancel
│   ├── wallet/                 # balance, transactions, admin credit adjustment
│   ├── reviews/                # ratings + comments tied to completed bookings
│   ├── notifications/          # in-app notifications
│   ├── dashboard/              # user dashboard, admin analytics, leaderboard, achievements
│   ├── admin/                   # user/skill moderation, booking oversight
│   ├── models/                  # MongoEngine documents (Users, Skills, Bookings, ...)
│   ├── common/                  # standard response, exceptions, decorators
│   └── utils/                   # logging, file upload, mock email, achievements
├── uploads/                    # uploaded profile pictures
├── logs/                       # rotating app logs
└── tests/                      # pytest suite
```

Each feature module (`auth`, `users`, `skills`, ...) follows the same pattern:

| File            | Responsibility                                   |
|-----------------|---------------------------------------------------|
| `routes.py`     | HTTP layer — thin, delegates to service           |
| `service.py`    | Business logic                                     |
| `repository.py` | Data access (MongoEngine queries)                  |
| `schema.py`     | Marshmallow request/response schemas               |
| `validator.py`  | Runs schema validation, raises standard errors      |

## Getting Started

### 1. Prerequisites
- Python 3.12+
- A MongoDB instance — either [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (recommended) or a local `mongod`

### 2. Install dependencies

```bash
cd Backend
python -m venv venv
source venv/bin/activate        # Windows: .venv/bin/activate 

pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:
- `MONGODB_URI` — your Atlas connection string or `mongodb://localhost:27017/peerskillswap`
- `SECRET_KEY` / `JWT_SECRET_KEY` — any long random strings

### 4. (Optional) Seed sample data

```bash
python seed_data.py
```

This creates an admin, two mentors, two students, three skills, and one
completed booking with a review, so the app isn't empty on first login.

Sample logins after seeding:
| Role    | Email                        | Password      |
|---------|-------------------------------|---------------|
| Admin   | admin@peerskillswap.com       | Admin@123     |
| Mentor  | alice@example.com             | Password@123  |
| Student | carol@example.com             | Password@123  |

### 5. Run the server

```bash
python app.py
```

The API is now available at `http://localhost:5000`.
Swagger docs: `http://localhost:5000/apidocs/`
Health check: `http://localhost:5000/api/health`

### 6. Run tests

```bash
pytest tests/ -v
```

Tests run against `mongomock`, so no real database is needed for CI.

### 7. Run with Docker

```bash
docker-compose up --build
```

This spins up the Flask API (Gunicorn) and a local MongoDB container together.

## API Overview

All responses follow a standard shape:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": { "...": "..." },
  "errors": null,
  "meta": { "page": 1, "per_page": 10, "total": 42, "total_pages": 5 }
}
```

Key endpoint groups (see Swagger or the included Postman collection for the
full list):

- `POST /api/auth/register`, `/login`, `/logout`, `/refresh`, `/forgot-password`, `/reset-password`
- `GET/PUT /api/users/me`, `POST /api/users/me/profile-picture`, `GET /api/users/mentors`
- `POST/GET/PUT/DELETE /api/skills`, `GET /api/skills/trending`, `/recommended`, `/mine`
- `POST /api/bookmarks/<skill_id>`, `GET /api/bookmarks`
- `POST /api/bookings`, `PATCH /api/bookings/<id>/accept|reject|complete|cancel`
- `GET /api/wallet`, `GET /api/wallet/transactions`, `POST /api/wallet/admin/adjust`
- `POST /api/reviews`, `GET /api/reviews/mentor/<id>`, `/skill/<id>`
- `GET /api/notifications`, `PATCH /api/notifications/<id>/read`
- `GET /api/dashboard/me`, `/admin`, `/leaderboard`, `/achievements`
- `GET/PATCH /api/admin/users`, `/skills`, `/bookings`

## Business Rules Worth Knowing

- New users receive `DEFAULT_SIGNUP_CREDITS` (default: 10) free credits on signup.
- Booking a session checks the student has enough credits **up front**, but
  credits only actually transfer (student → mentor) when the mentor marks the
  session **completed**.
- Reviews can only be left once per completed booking, by the student who
  attended.
- Achievements (`FIRST_SESSION_TAUGHT`, `TOP_RATED_MENTOR`, etc.) unlock
  automatically as milestones are hit, and trigger a notification.
- The leaderboard is a cached collection (`LeaderboardEntry`), recomputed on
  demand via `GET /api/dashboard/leaderboard?refresh=true`.

## Next Session

The React + Vite + Material UI frontend will be generated in the next session
and will consume this API directly (`VITE_API_BASE_URL` pointing here).

Backend runs at

```
http://localhost:8080
```

---

## Frontend Setup

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

Frontend runs at

```
http://localhost:5173
```

---

## API Features

- User Authentication
- Login
- Register
- JWT Token Generation
- Skill Management
- Booking Management
- Credit Management
- Reviews

---

## Screenshots

> Screenshots will be added after project completion.

- Login Page
- Register Page
- Dashboard
- Skills Page
- Booking Page
- Wallet
- Reviews

---

## Future Enhancements

- AI Mentor Recommendation
- Video Calling Integration
- Chat System
- Email Notifications
- Mobile Application
- Skill Certificates
- AI Career Guidance

---

## Learning Outcomes

This project demonstrates practical knowledge of:

- Spring Boot
- REST API Development
- JWT Authentication
- React
- MongoDB
- Material UI
- Clean Architecture
- Full Stack Development

---

## Author

**  POOSARLA Raja  **

GitHub:
https://github.com/Rajacodev

---

## License

This project is created for educational purposes.
