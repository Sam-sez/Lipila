import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [role, setRole] = useState("person"); // person | merchant | agent
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !/^0\d{9}$/.test(number)) {
      setError("Enter your name and a 10-digit number starting with 0 (e.g. 0977123456).");
      return;
    }
    setBusy(true);
    try {
      await login({
        mobile_number: number,
        legal_name: name.trim(),
        provider: "MTN",
        is_merchant: role === "merchant",
        is_agent: role === "agent",
        merchant_category: role === "agent" ? "agent" : role === "merchant" ? "market_stall" : null,
      });
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not create account — try a different number.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen center-col" style={{ justifyContent: "center", minHeight: "100vh" }}>
      <h1>Lipila</h1>
      <p className="muted" style={{ marginBottom: 28 }}>Scan, confirm, done.</p>

      <form onSubmit={submit} style={{ width: "100%" }}>
        <input
          className="field"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="field"
          placeholder="Mobile number (e.g. 0977123456)"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />

        <div className="muted" style={{ textAlign: "left", marginBottom: 8 }}>I am a…</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[
            { key: "person", label: "Regular user" },
            { key: "merchant", label: "Merchant" },
            { key: "agent", label: "MoMo agent" },
          ].map((r) => (
            <button
              type="button"
              key={r.key}
              onClick={() => setRole(r.key)}
              className={role === r.key ? "btn-primary" : "btn-secondary"}
              style={{ fontSize: 13, padding: "10px 8px" }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

        <button className="btn-primary" disabled={busy}>
          {busy ? "Setting up…" : "Continue"}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 20, fontSize: 12 }}>
        Demo build — this creates a real record in the Lipila database, but
        moves no real money. No password: this is a prototype identity, not
        a bank login.
      </p>
    </div>
  );
}
