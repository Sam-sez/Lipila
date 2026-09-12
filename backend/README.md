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

Visit `http://localhost:8000/docs` for interactive API docs (Swagger UI) —
every endpoint below is listed there with a "Try it out" button.

Runs against SQLite and a mocked payment provider by default. No MTN
account, no Postgres, no Redis needed to fully exercise every flow.

## What's implemented

| Flow | Endpoints |
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

1. **Database** — set `DATABASE_URL` to a Neon Postgres connection string.
2. **Redis** — set `REDIS_URL` to a real Redis instance (Upstash works well on Render).
3. **MTN MoMo** — register Collections + Disbursements products at
   [momodeveloper.mtn.com](https://momodeveloper.mtn.com) (free, self-serve
   for sandbox). Set `PAYMENT_PROVIDER=mtn` plus the three MTN_* keys.
   Disbursements needs MTN to verify you as a real business before
   *production* access — sandbox testing works the same day.
4. **Multi-network (Airtel/Zamtel)** — swap in an aggregator (PawaPay/Bila)
   by writing one more class that implements `app/providers/base.py`'s
   `PaymentProvider` interface, same pattern as `mtn_provider.py`.

## Deploying (Render)

- New Web Service → point at this repo's `backend/` directory.
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add the env vars from `.env.example` in Render's dashboard.
