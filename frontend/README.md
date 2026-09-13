# Lipila Frontend

React + Vite web app demonstrating every core Lipila flow: Static/Dynamic
QR (real camera scanning via html5-qrcode), Favorites, transaction
history/ledger, Bong, and Agent tools.

## Run locally

```bash
npm install
npm run dev
```

Defaults to talking to a backend at `http://localhost:8000/api` — run the
backend per its own README alongside this. To point elsewhere, copy
`.env.example` to `.env` and set `VITE_API_BASE_URL`.

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

## Deploying

See the root `README.md` and `vercel.json` — this frontend deploys as one
service inside a single Vercel project alongside the backend, both served
from one domain via Vercel's Services model. Set `VITE_API_BASE_URL=/api`
(a relative path) in that project's environment variables — no CORS
configuration needed since it's the same origin as the backend.
