# 🚀 PeerSkillSwap

> A credit-based peer-to-peer skill exchange platform. Teach a skill to earn credits, then spend those credits to learn from others.

![Python](https://img.shields.io/badge/Python-3.12-blue)
![Flask](https://img.shields.io/badge/Flask-3.x-black)
![React](https://img.shields.io/badge/React-18-61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-7-brightgreen)
![JWT](https://img.shields.io/badge/JWT-Authentication-red)
![CI](https://github.com/Rajacodev/PeerSkillSwap_batch99/actions/workflows/ci.yml/badge.svg)

---

## 📖 About the Project

PeerSkillSwap is a full-stack web application where people exchange knowledge instead of money. Members teach a skill to earn **credits**, then spend those credits to book sessions with other mentors.

The platform includes secure authentication, skill listings, session bookings, a credit wallet, live video calls, reviews, and an AI career advisor.

---

## ✨ Features

- 🔐 Registration, login, JWT sessions with refresh, and password reset
- 👥 Student, mentor and admin roles
- 📚 Skill listings with search, filters, sorting, bookmarks and recommendations
- 📅 Session bookings: request, accept, reject, complete or cancel
- 🔗 Optional meeting links (Zoom, Google Meet, Teams) on bookings
- 💳 Credit wallet with transaction history
- 🎥 Live one-to-one video calls with screen sharing and in-call chat (WebRTC)
- ⭐ Reviews, achievement badges and a leaderboard
- 🤖 AI career advisor that suggests the skills needed for a target job (Claude, ChatGPT, Gemini, Llama via Groq, or a built-in fallback)
- 🔔 Notifications, user dashboards and an admin area
- 📱 Responsive Material UI interface with dark mode

---

## 🛠 Tech Stack

**Backend**
- Python 3.12, Flask
- MongoDB with MongoEngine
- Flask-JWT-Extended, Flask-Bcrypt, Marshmallow
- Flask-SocketIO (video-call signalling)
- Swagger docs via Flasgger

**Frontend**
- React 18, Vite
- Material UI, React Router, React Hook Form, Axios
- socket.io-client (video calls)

**Production**
- Gunicorn, nginx, Docker Compose, Caddy (HTTPS)

**Continuous integration**
- GitHub Actions: backend tests and lint, frontend lint and build, Docker image builds

---

## 📂 Project Structure

```
PeerSkillSwap/
│
├── Backend/                    Flask API
│   ├── app/                    Application package (one folder per feature)
│   ├── tests/                  pytest suite
│   ├── config.py               Settings for each environment
│   ├── app.py                  Development server
│   ├── wsgi.py                 Production entry point
│   ├── create_admin.py         Creates an administrator account
│   ├── seed_data.py            Demo data (development only)
│   ├── Dockerfile
│   ├── docker-compose.yml      Full stack: frontend, API and MongoDB
│   └── DEPLOYMENT.md           Production deployment guide
│
├── Frontend/                   React application
│   ├── src/                    Pages, components, services, hooks
│   ├── nginx.conf              Production web server configuration
│   └── Dockerfile
│
└── .github/workflows/ci.yml    Continuous integration
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.12 or newer
- Node.js 22 or newer
- MongoDB, either installed locally or started with Docker:
  ```bash
  docker run -d -p 27017:27017 --name mongo mongo:7
  ```

### Clone the repository

```bash
git clone https://github.com/Rajacodev/PeerSkillSwap_batch99.git
cd PeerSkillSwap_batch99
```

---

## Backend Setup

```bash
cd Backend
python -m venv venv
source venv/bin/activate          # Windows PowerShell: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env              # Windows: copy .env.example .env
```

Open `.env` and set the database address for local development:

```
MONGODB_URI=mongodb://localhost:27017/peerskillswap
```

Optionally, load demo data:

```bash
python seed_data.py
```

This creates an admin, two mentors, two students, sample skills and a completed booking with a review.

| Role    | Email                     | Password     |
|---------|---------------------------|--------------|
| Admin   | admin@peerskillswap.com   | Admin@123    |
| Mentor  | alice@example.com         | Password@123 |
| Student | carol@example.com         | Password@123 |

Start the server:

```bash
python app.py
```

- API: http://localhost:5000
- Health check: http://localhost:5000/api/health
- Swagger docs: http://localhost:5000/apidocs/

---

## Frontend Setup

In a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

Open http://localhost:5173.

In development, Vite forwards `/api`, `/uploads` and `/socket.io` to the backend, so no URL configuration is needed. The app also works from another device on the same network, using your computer's IP address.

---

## Configuration

All backend settings live in `Backend/.env`. Every option is explained in `Backend/.env.example`. The most important ones:

| Setting | Purpose |
|---------|---------|
| `FLASK_ENV` | `development`, `testing` or `production` |
| `SECRET_KEY`, `JWT_SECRET_KEY` | Signing keys, at least 32 random characters |
| `MONGODB_URI` | Database connection (local or MongoDB Atlas) |
| `CORS_ORIGINS` | Browser origins allowed to call the API directly |
| `TURN_SERVER_URL` and related | Optional TURN server for video calls on strict networks |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY` | Optional, enable AI providers |

Generate a secret with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Never commit `.env` files. They are listed in `.gitignore`.

---

## 🧪 Running Tests and Checks

```bash
# Backend (from Backend/, with the virtual environment active)
pip install pytest mongomock
pytest tests/

# Frontend (from Frontend/)
npm run lint
npm run build
```

The backend tests use an in-memory database and never call real AI providers.

---

## 🐳 Deployment

Production runs with Docker Compose: a public nginx frontend, a private API, and a password-protected MongoDB. Step-by-step instructions, including HTTPS, backups and TURN, are in [`Backend/DEPLOYMENT.md`](Backend/DEPLOYMENT.md).

```bash
cd Backend
cp .env.example .env              # set every REQUIRED value first
docker compose up -d --build
docker compose exec -it backend python create_admin.py
```

The production API refuses to start with example secrets, so a copied configuration cannot reach users unchanged.

---

## 📡 API Overview

All responses share one format: `success`, `message`, `data`, `errors` and, for lists, `meta` (pagination).

| Prefix | Area |
|--------|------|
| `/api/auth` | Register, login, logout, refresh, password reset |
| `/api/users` | Profile, photo upload, mentor directory |
| `/api/skills` | Listings, search, trending, recommendations, mine |
| `/api/bookmarks` | Saved skills |
| `/api/bookings` | Requests, acceptance, completion, meeting links |
| `/api/wallet` | Balance, transactions, admin adjustments |
| `/api/reviews` | Ratings for mentors and skills |
| `/api/notifications` | In-app notifications |
| `/api/dashboard` | Stats, leaderboard, achievements |
| `/api/admin` | Moderation of users, skills and bookings |
| `/api/ai` | Career advisor and provider status |
| `/api/calls` | STUN and TURN configuration for video calls |

A Postman collection covering these endpoints is in `Backend/PeerSkillSwap.postman_collection.json`.

---

## 📸 Screenshots

> Screenshots will be added after the project is finalized.

- Login and register pages
- Dashboard
- Browse skills and skill details
- Bookings and video call
- Wallet and reviews
- AI career advisor

---

## 🔮 Future Enhancements

- Chat messages outside of calls
- Email notifications (currently mocked and logged)
- Mobile application
- Skill certificates
- Redis-backed call state, to allow multiple backend servers

---

## 🎓 Learning Outcomes

This project demonstrates practical knowledge of:

- Python and Flask application design (app factory, blueprints, layered services)
- REST API development and JWT authentication
- MongoDB data modelling
- Real-time communication with Socket.IO and WebRTC
- React, Vite and Material UI
- Integrating third-party AI APIs with fallback handling
- Testing, continuous integration, Docker and production deployment

---

## 👤 Author

**POOSARLA Raja**

GitHub: https://github.com/Rajacodev

---

## 📄 License

No license has been chosen yet. Add a `LICENSE` file before others reuse the code.
