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

## Deploying (Vercel + Neon)

Vercel's Python runtime auto-detects FastAPI apps at `app/main.py` — this
repo already matches that pattern, so deployment is close to zero-config.
One real constraint: Vercel functions are serverless (no persistent local
state), so SQLite and the in-memory Redis fallback that work for local dev
**must** be swapped for real Neon/Upstash before deploying.

1. **Neon:** create a project at [neon.tech](https://neon.tech) (free
   tier). Copy the **pooled** connection string (hostname contains
   `-pooler`) — serverless functions open a fresh DB connection per
   request, and pooling prevents exhausting Postgres's connection limit.
2. **Upstash Redis:** in your Vercel project dashboard → Storage/Marketplace
   → add Upstash Redis (free tier). It wires `REDIS_URL` in automatically.
3. **Import the repo in Vercel:** New Project → import this GitHub repo →
   set **Root Directory** to `backend`. Vercel will detect the FastAPI
   framework preset automatically.
4. **Environment variables** (Vercel project settings): set `DATABASE_URL`
   to the Neon pooled string, confirm `REDIS_URL` is set (from step 2), and
   set `FRONTEND_ORIGIN` to your deployed frontend's URL once you have it
   (step 4 in the frontend README).
5. Deploy. First request will run `Base.metadata.create_all`, creating the
   tables in Neon automatically.

If you deploy with a leftover SQLite/local Redis config by mistake, the app
logs a loud warning at startup rather than failing silently — check your
Vercel function logs.
