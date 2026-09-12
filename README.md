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

## Quick start

```bash
# Backend
cd backend
python3 -m venv venv && ./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open the frontend, create an account (try one "Regular user" and one
"MoMo agent" to see every screen), and pay around with fake money — no
real MTN/Airtel account needed.
