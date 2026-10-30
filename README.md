# PeerSkillSwap

**Trade skills, not money.** PeerSkillSwap is a credit-based platform for peer learning. Members teach a skill to earn credits, then spend those credits to learn from other members.

## Features

- Accounts with student, mentor and admin roles, JWT login and password reset
- Skill listings with search, filters, bookmarks and recommendations
- Session bookings with accept, complete and cancel, plus optional meeting links
- Credit wallet with transaction history
- Live one-to-one video calls with screen sharing and chat (WebRTC)
- Reviews, achievement badges and a leaderboard
- AI career advisor that suggests skills for a target job (Claude, ChatGPT, Gemini, Groq, or a built-in fallback)
- Notifications, dashboards and an admin area

## Tech stack

- **Backend:** Python 3.12, Flask, MongoDB (MongoEngine), Flask-SocketIO
- **Frontend:** React 18, Vite, Material UI
- **Production:** Gunicorn, nginx, Docker Compose
- **CI:** GitHub Actions

## Project layout

```
Backend/     Flask API, tests, Dockerfile, docker-compose.yml
Frontend/    React application, nginx config, Dockerfile
```

## Run locally

You need Python 3.12, Node.js 22 and a MongoDB server (for example `docker run -d -p 27017:27017 mongo:7`).

**Backend**

```bash
cd Backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Windows: copy .env.example .env
python app.py
```

In `.env`, set `MONGODB_URI=mongodb://localhost:27017/peerskillswap`.

**Frontend** (in a second terminal)

```bash
cd Frontend
npm install
npm run dev
```

Open http://localhost:5173. The API health check is at http://localhost:5000/api/health.

## Configuration

All settings are in `Backend/.env`. Every option is explained in `Backend/.env.example`. Never commit your `.env` file.

Generate secrets with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

## Tests

```bash
cd Backend
pytest tests/

cd ../Frontend
npm run lint
npm run build
```

## Deployment

Production runs with Docker Compose behind HTTPS. See [Backend/DEPLOYMENT.md](Backend/DEPLOYMENT.md) for the full guide.

## License

No license has been chosen yet.
