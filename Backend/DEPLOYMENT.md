# Deploying PeerSkillSwap

This guide covers running the full application in production with Docker
Compose on a single Linux server. The same images run on any container
platform (ECS, Cloud Run, Kubernetes) with the environment variables below.

## Architecture

```
Browser ──HTTPS──▶ [ Reverse proxy / TLS ] ──▶ frontend (nginx :8080)
                                                  │  serves the React app
                                                  │  forwards /api, /uploads, /socket.io
                                                  ▼
                                             backend (Gunicorn :5000)   (private)
                                                  │
                                                  ▼
                                             mongo 7 (private, authenticated)
```

Only the frontend is published. The API and MongoDB are reachable only inside
the Docker network.

**Important constraint:** run exactly one backend worker process. Video-call
rooms are held in memory, so a second process would not see the same rooms.
`gunicorn.conf.py` enforces this. Concurrency comes from threads.

## 1. Prerequisites

- A Linux server with Docker Engine and the Compose plugin (`docker compose version`).
- A domain name pointing at the server, and a way to terminate HTTPS (see section 5).
- The two project folders side by side:
  ```
  PeerSkillSwap/
    Backend/    (contains docker-compose.yml and .env)
    Frontend/
  ```

## 2. Configure

```bash
cd PeerSkillSwap/Backend
cp .env.example .env
```

Edit `.env` and set every value marked **REQUIRED**. Generate each secret separately:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

| Setting | What to put |
|---------|-------------|
| `SECRET_KEY`, `JWT_SECRET_KEY` | Two different random values from the command above. |
| `MONGO_ROOT_PASSWORD` | A random value (letters and digits, or `token_urlsafe` output). |
| `PUBLIC_ORIGIN` | The exact address users type, e.g. `https://peerskillswap.example.com`. It must match the browser address, including scheme and port, or sockets and CORS will be refused. |
| `PUBLIC_PORT` | The local port the frontend container publishes (default `8080`). |
| `TURN_*` | Optional. Needed for video calls on strict networks (see section 5). |
| AI keys | Optional. Leave empty to use the built-in career data. |

The backend refuses to start in production if a secret is still an example
value or shorter than 32 characters. It lists every problem at once.

## 3. Start

```bash
docker compose up -d --build
docker compose ps                       # all services should become "healthy"
docker compose logs -f backend          # watch the API start
```

Checks:

```bash
curl -s http://localhost:8080/healthz                 # frontend: "ok"
curl -s http://localhost:8080/api/health              # API is running
curl -s http://localhost:8080/api/health/ready        # API can reach MongoDB
```

## 4. Create the first administrator

Demo accounts are never created in production. Create an administrator
interactively, so the password does not enter shell history:

```bash
docker compose exec -it backend python create_admin.py
```

Log in at `PUBLIC_ORIGIN`, then use the admin area.

## 5. HTTPS, video calls and TURN

Browsers allow camera and microphone access (needed for video calls) only on
HTTPS or `localhost`. Put a reverse proxy with automatic certificates in front
of the frontend container. For example, with Caddy:

```
peerskillswap.example.com {
    reverse_proxy localhost:8080
}
```

Caddy obtains and renews certificates automatically, and it passes WebSocket
traffic for call signalling through without extra configuration. Any other
TLS-terminating proxy or cloud load balancer works too, as long as it forwards
`/socket.io` WebSocket connections. Set `PUBLIC_ORIGIN` to the HTTPS address.

**TURN (recommended for calls).** Some corporate and mobile networks block
direct peer-to-peer media. Run a TURN server such as coturn, then set
`TURN_SERVER_URL`, `TURN_USERNAME` and `TURN_CREDENTIAL` in `.env`. Calls from
those networks fail without it.

## 6. Operations

**Updating:**
```bash
git pull
docker compose up -d --build
```

**Logs:** the containers write to stdout. Use `docker compose logs`, or ship
them to your log platform.

**Backups.** The database is the main state. Back it up regularly and test
restoring:
```bash
docker compose exec mongo sh -c 'mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive' > backup-$(date +%F).archive
```
Uploaded profile pictures live in the `uploads_data` volume. Back that up too.

**Using MongoDB Atlas instead of the bundled container:** remove the `mongo`
service and its `depends_on` entry from `docker-compose.yml`, then set
`MONGODB_URI` in the backend's `environment` section to your Atlas connection
string.

**Scaling:** the backend must stay at one worker, because call rooms are in
memory. Scaling beyond one backend process needs a shared store for call-room
state and Socket.IO messages, such as Redis, before it is safe.

## 7. Security checklist

- [ ] `SECRET_KEY` and `JWT_SECRET_KEY` are unique, random, and at least 32 characters.
- [ ] `MONGO_ROOT_PASSWORD` is set. MongoDB is not published to the host.
- [ ] `PUBLIC_ORIGIN` is the real HTTPS address.
- [ ] HTTPS is enforced at the edge; HTTP redirects to HTTPS.
- [ ] Demo accounts were never seeded in production (`seed_data.py` refuses to run).
- [ ] Administrator created with `create_admin.py` and a strong password.
- [ ] Backups are scheduled and a restore has been tested.
- [ ] `.env` is not committed to version control (it is in `.gitignore`).

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| Backend container keeps restarting | Read `docker compose logs backend`. It lists the configuration problems, such as an example secret or a missing `MONGODB_URI`. |
| "Network Error" when registering | `PUBLIC_ORIGIN` does not match the address in the browser, or HTTPS is misconfigured. |
| Calls fail to connect | The proxy is not forwarding WebSockets, or the network needs a TURN server. |
| Backend reports "Database unavailable" | MongoDB not healthy yet, or wrong `MONGO_ROOT_PASSWORD`. A root password change only applies to a new data volume. |
| Images look stale after an update | Run `docker compose up -d --build` so the images are rebuilt. |
