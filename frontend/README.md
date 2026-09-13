# Lipila Frontend

React + Vite web app demonstrating every core Lipila flow: Static/Dynamic
QR (real camera scanning via html5-qrcode), Favorites, transaction
history/ledger, Bong, and Agent tools.

## Run locally

```bash
npm install
npm run dev
```

Defaults to talking to a backend at `http://localhost:8000`. To point at a
deployed backend, copy `.env.example` to `.env` and set
`VITE_API_BASE_URL`.

## One real technical constraint: Bong

The blueprint's "Bong" (mutual Bluetooth proximity discovery) can't be
built as a genuine background BLE scan in a browser — the Web Bluetooth
API only lets a page connect to a single device the user explicitly picks
from a native browser popup; it can't passively sense nearby phones the
way a native app can.

The `/bong` screen here runs the **real backend matching and
identity-reveal logic** (anonymized candidates, identity shown only after
a confirmed match), but simulates "detection" by having you paste in the
other person's Bong code by hand instead of real BLE. A native (React
Native) build later would swap in real `react-native-ble-plx` scanning
against the same backend endpoints — no backend changes needed.

## Deploying (Vercel)

Vite/React is a first-class Vercel framework preset — this is close to
zero-config:

1. Import this GitHub repo as a New Project in Vercel.
2. Set **Root Directory** to `frontend`.
3. Vercel auto-detects the Vite build (`npm run build`, output `dist`) —
   no extra config needed.
4. Add environment variable `VITE_API_BASE_URL` = your deployed backend's
   Vercel URL (e.g. `https://lipila-backend.vercel.app`). Vite env vars are
   baked in at build time, so redeploy after changing this.
5. Once deployed, copy this project's URL and set it as `FRONTEND_ORIGIN`
   in the **backend's** Vercel environment variables, so CORS allows it.
