import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Agents, QR } from "../api/client";

export default function AgentTools() {
  const { user } = useAuth();
  const [mode, setMode] = useState("cash-in"); // cash-in | cash-out
  const [scannedQrToken, setScannedQrToken] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [resolvedIdentity, setResolvedIdentity] = useState(null);

  const resolveScanned = async () => {
    setError("");
    setResolvedIdentity(null);
    if (!scannedQrToken.trim()) {
      setError("Enter the user's static QR token.");
      return;
    }
    try {
      const identity = await QR.resolveStatic(scannedQrToken.trim());
      setResolvedIdentity(identity);
    } catch (err) {
      setError("Could not resolve that QR code.");
    }
  };

  const submit = async () => {
    setError("");
    if (!amount || Number(amount) <= 0) {
      setError("Enter the cash amount.");
      return;
    }
    try {
      let txn;
      if (mode === "cash-in") {
        // Agent scans user's QR, enters cash physically received, pushes
        // equivalent funds into the user's wallet via Disbursements.
        txn = await Agents.cashIn(user.id, scannedQrToken.trim(), Number(amount));
      } else {
        // User pays the agent (Collections) — here the agent is entering
        // the user's QR token on the user's behalf for demo purposes only;
        // in the real app the USER scans the AGENT's QR themselves.
        txn = await Agents.cashOut(scannedQrToken.trim(), user.static_qr_token, Number(amount));
      }
      setResult(txn);
    } catch (err) {
      setError(err?.response?.data?.detail || "Transaction failed.");
    }
  };

  if (!user.is_agent) {
    return (
      <div className="screen center-col" style={{ marginTop: 40 }}>
        <h3>Agent tools</h3>
        <p className="muted">This section is only available to registered MoMo agent accounts.</p>
      </div>
    );
  }

  return (
    <div className="screen">
      <h2>Agent tools</h2>
      <div className="disclaimer-box">
        Lipila records and confirms the digital transfer only — it can't verify
        or guarantee the physical cash handoff itself.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className={mode === "cash-in" ? "btn-primary" : "btn-secondary"} onClick={() => { setMode("cash-in"); setResult(null); }}>
          Cash-in
        </button>
        <button className={mode === "cash-out" ? "btn-primary" : "btn-secondary"} onClick={() => { setMode("cash-out"); setResult(null); }}>
          Cash-out
        </button>
      </div>

      {!result && (
        <div className="card">
          <label className="muted">
            {mode === "cash-in" ? "Scan user's QR (enter token)" : "User's QR token (they scan yours normally)"}
          </label>
          <input className="field" value={scannedQrToken} onChange={(e) => setScannedQrToken(e.target.value)} placeholder="QR token" />
          <button className="btn-secondary" onClick={resolveScanned}>Verify identity</button>

          {resolvedIdentity && (
            <div className="identity-row">
              <div className="avatar">{resolvedIdentity.name?.[0]?.toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{resolvedIdentity.name}</div>
                <div className="verified-badge">✓ ···{resolvedIdentity.verified_number_suffix}</div>
              </div>
            </div>
          )}

          <label className="muted">Cash amount (ZMW)</label>
          <input className="field" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />

          {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

          <button className="btn-primary" onClick={submit}>
            {mode === "cash-in" ? "Push funds to user" : "Request payment from user"}
          </button>
        </div>
      )}

      {result && (
        <div className="card center-col">
          <div style={{ fontSize: 32 }}>✅</div>
          <h3>{mode === "cash-in" ? "Cash-in recorded" : "Cash-out requested"}</h3>
          <p className="ledger-amount" style={{ fontSize: 22 }}>K{result.amount.toFixed(2)}</p>
          <span className="tag">{result.auto_tag}</span>
          <button className="btn-secondary" style={{ marginTop: 14 }} onClick={() => { setResult(null); setScannedQrToken(""); setAmount(""); setResolvedIdentity(null); }}>
            New transaction
          </button>
        </div>
      )}
    </div>
  );
}
