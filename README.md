# Lipila
*"Lipila" — Bemba for "Pay"*

Scan, confirm, done. Lipila removes payment friction in Zambia by
replacing slow USSD flows and manual number entry with instant QR-based
and proximity-based payments — sitting on top of MTN MoMo / Airtel Money
without ever custodying funds or seeing a PIN.

This repo contains a working prototype: real backend logic for every
core flow, and a functional web frontend to demo it end to end.

## Structure

- **`/backend`** — FastAPI orchestration layer. Static QR, Dynamic QR,
  Bong (proximity pay matching), Favorites, transaction notes/history,
  and agent cash-in/cash-out. Runs today against a mocked payment
  provider — real MTN sandbox/production keys slot in later via env
  vars, no code changes needed. See `backend/README.md`.
- **`/frontend`** — React web app. Real camera-based QR scanning,
  biometric-then-PIN confirmation flow, and every screen from the
  blueprint. See `frontend/README.md` for a note on Bong's one real
  technical constraint (browsers can't do silent BLE proximity
  scanning — that needs a native app).

## Status vs. the original blueprint

Built: Static QR, Dynamic QR, Notes, Favorites, Bong (backend logic full;
frontend is an honestly-labeled simulated demo of it), Nicknames with
verified-identity display, Agent cash-in/cash-out with auto-tagged notes
and the cash-handoff disclaimer.

Deliberately cut from scope: Agent Locator.

Not yet done: real MTN sandbox credentials wired in (mocked for now),
production deployment (Render/Neon), native mobile app for true Bong.

## Quick start (local)

```bash
# Backend
cd backend
python3 -m venv venv && ./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn app.main:app --reload
# API now at http://localhost:8000/api (see "Why /api" in backend/README.md)

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open the frontend, create an account (try one "Regular user" and one
"MoMo agent" to see every screen), and pay around with fake money — no
real MTN/Airtel account needed.

## Deploying

This repo is set up for [Vercel Services](https://vercel.com/docs/services) —
one Vercel project serving both `frontend` and `backend` from a single
domain (see `vercel.json`). This is simpler than separate projects: no
CORS configuration needed, since both are same-origin.

1. In Vercel, **New Project** → import this repo. When it detects both
   `frontend/` and `backend/` and shows an **Application Preset** of
   **Services**, that's this exact setup — accept it.
2. Set env vars on the project: `DATABASE_URL` (Neon **pooled** connection
   string), `REDIS_URL` (add Upstash Redis from the dashboard's
   Storage/Marketplace tab — this sets it automatically), and
   `VITE_API_BASE_URL=/api`.
3. Deploy. Both services build from one push, served from one URL —
   `yourproject.vercel.app/` for the app, `yourproject.vercel.app/api/*`
   for the backend.

See `backend/README.md` and `frontend/README.md` for details on each side,
including going from the mocked payment provider to real MTN sandbox keys.
