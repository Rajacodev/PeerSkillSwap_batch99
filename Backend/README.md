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

### Troubleshooting: "Network Error" on register/login

Two config issues cause almost all of these:

1. **`MONGODB_URI` still has placeholder values** (`<username>`, `<password>`,
   `cluster0.mongodb.net`) — the app now refuses to start and prints a clear
   fix in the terminal rather than failing silently mid-request. Either
   paste in your real Atlas connection string, or use a local Mongo instance:
   `MONGODB_URI=mongodb://localhost:27017/peerskillswap`.
2. **CORS mismatch** — if your frontend isn't on exactly `localhost:5173`
   (e.g. Vite picked a different port because 5173 was busy, or you're
   testing from another device's LAN IP), the browser silently blocks the
   response. In development (`FLASK_ENV=development`, the default), this is
   now handled automatically — any `localhost`, `127.0.0.1`, or private LAN
   address (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`) on any port is
   allowed, no `.env` edits needed. In production, `CORS_ORIGINS` is used
   exactly as configured, since that's a real security boundary once this
   is deployed publicly — list every real frontend origin there.


### 1. Prerequisites
- Python 3.12+
- A MongoDB instance — either [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (recommended) or a local `mongod`

### 2. Install dependencies

```bash
cd Backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
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

For a production deployment, follow [DEPLOYMENT.md](DEPLOYMENT.md). It covers
the full stack (frontend, API and MongoDB), secrets, HTTPS and backups:

```bash
docker compose up -d --build
```

The API image runs as a non-root user, with Gunicorn and a health check. It
does not include `.env`, tests, or local data (see `.dockerignore`).


## AI Career Advisor

`POST /api/ai/recommend-skills` takes a target job title and returns a
short summary plus a prioritized list of skills to learn, each one
cross-referenced against skills already listed on the platform so users
can book a mentor immediately.

**Four AI APIs are supported**, all optional (`app/ai/providers.py`):

| Provider | Key setting | Default model setting |
|----------|-------------|-----------------------|
| Anthropic (Claude) | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL` |
| OpenAI (ChatGPT) | `OPENAI_API_KEY` | `OPENAI_MODEL` |
| Google Gemini | `GEMINI_API_KEY` | `GEMINI_MODEL` |
| Groq (Llama) | `GROQ_API_KEY` | `GROQ_MODEL` |

- Providers that have a key are tried in the order set by
  `AI_PROVIDER_ORDER` (default `anthropic,openai,gemini,groq`). The first
  usable answer wins; if one errors, times out, or returns something that
  isn't valid JSON, the next one is tried automatically.
- With no keys, or if every provider fails, a curated rule-based dataset
  (`app/ai/fallback_data.py`, ~15 roles plus a generic list) is used, so
  the endpoint never hard-fails.
- Each result records which provider produced it (`provider`), and
  `GET /api/ai/providers` reports which are configured, without ever
  returning the keys.
- Model names are settings because providers rename and retire models; if
  a call starts failing, check the model name first.
- Every query is saved to `CareerRecommendation`; `GET
  /api/ai/recommendations` returns the user's history.
- Tests mock the HTTP layer, so they verify each provider's request and
  response format and the failover logic, but no real API is called.


## Video Calls (WebRTC)

Mentors and students can hold a live video call with screen sharing, inside
the app. The media never passes through the server.

- **Signalling** runs over Socket.IO (`app/calls/events.py`). It handles
  join and leave, relays WebRTC offers, answers and ICE candidates, and carries
  a small in-call chat. Audio, video and screen share flow directly between the
  two browsers once connected.
- **Authentication**: the socket connects with an access token
  (`{auth: {token}}`). Refresh tokens are refused.
- **Access rules**: only the booking's mentor or student can join, and only once
  the booking is `accepted` or `completed`. A reconnecting user (after a page
  refresh) replaces their old connection, so they are not locked out.
- **TURN**: `TURN_SERVER_URL`, `TURN_USERNAME` and `TURN_CREDENTIAL` add a TURN
  server for networks that block direct connections. STUN is always included.
- **Single worker**: call rooms are held in memory, so the backend runs as one
  Gunicorn worker process (`gunicorn.conf.py`). Concurrency comes from threads.

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
- `POST /api/ai/recommend-skills`, `GET /api/ai/recommendations`, `GET /api/ai/providers` — AI career advisor
- `GET /api/calls/ice-servers` — STUN and TURN servers for video calls
- Socket.IO events (`/socket.io/`): `join_call`, `signal`, `chat_message`, `leave_call` — see [Video Calls](#video-calls-webrtc)

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
