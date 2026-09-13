# Lipila Backend

FastAPI orchestration layer over MTN MoMo / Airtel Money. Lipila never
custodies funds and never sees a PIN — see the root `README.md` for the
full product blueprint.

## Run it locally (works today, zero setup)

```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn app.main:app --reload
```

The whole API is mounted under `/api` (see "Why /api" below), so visit
`http://localhost:8000/api/docs` for interactive API docs.

Runs against SQLite and a mocked payment provider by default. No MTN
account, no Postgres, no Redis needed to fully exercise every flow.

## Why /api

This backend is deployed as one "service" inside a single Vercel project
alongside the frontend (see root `vercel.json`) — both served from one
domain, no CORS setup needed in production. Vercel's Services routing
forwards the full original request path rather than stripping the matched
prefix, so the whole app is mounted at `/api` internally to match.

## What's implemented

| Flow | Endpoints (all under `/api`) |
|---|---|
| Static QR (merchants/agents) | `GET /qr/static/{user_id}`, `POST /qr/static/resolve` |
| Dynamic QR (P2P, exact amount) | `POST /qr/dynamic`, `POST /qr/dynamic/resolve` — Redis TTL-backed expiry |
| Payment confirm (shared by every flow) | `POST /payments/confirm`, `GET /payments/{id}/status` |
| Transaction history / notes | `GET /payments/history/{user_id}` |
| Favorites (opt-in save) | `GET /favorites/{owner_id}`, `POST /favorites`, `DELETE /favorites/{owner_id}/{saved_user_id}` |
| Bong (proximity pay) | `POST /bong/announce`, `POST /bong/candidates`, `POST /bong/reveal/{session_token}` |
| Agent cash-in/cash-out | `POST /agents/cash-in` (Disbursements), `POST /agents/cash-out` (Collections) |

Agent Locator was deliberately cut from scope.

## Going from mock to real money

Nothing above needs rewriting. Set these env vars (see `.env.example`):

1. **Database** — set `DATABASE_URL` to a Neon Postgres connection string
   (use the **pooled** one, hostname contains `-pooler`).
2. **Redis** — set `REDIS_URL` to a real Redis (Upstash, added from the
   Vercel dashboard's Storage/Marketplace tab, wires this in automatically).
3. **MTN MoMo** — register Collections + Disbursements products at
   [momodeveloper.mtn.com](https://momodeveloper.mtn.com) (free, self-serve
   for sandbox). Set `PAYMENT_PROVIDER=mtn` plus the three MTN_* keys.
   Disbursements needs MTN to verify you as a real business before
   *production* access — sandbox testing works the same day.
4. **Multi-network (Airtel/Zamtel)** — swap in an aggregator (PawaPay/Bila)
   by writing one more class that implements `app/providers/base.py`'s
   `PaymentProvider` interface, same pattern as `mtn_provider.py`.

## Deploying

See the root `README.md` and `vercel.json` — this backend deploys as one
service inside a single Vercel project alongside the frontend, not as a
separate project. If you deploy with a leftover SQLite/local Redis config
by mistake, the app logs a loud warning at startup rather than failing
silently — check your Vercel function logs.
