import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Users } from "../api/client";

export default function Login() {
  const { login, loginExisting } = useAuth();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [isAgent, setIsAgent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^0\d{9}$/.test(number)) {
      setError("Enter a 10-digit number starting with 0 (e.g. 0977123456).");
      return;
    }
    setBusy(true);
    try {
      // Recognize returning users by number alone — this is a demo identity
      // with no password, so "sign in" and "sign up" are the same form.
      const existing = await Users.getByNumber(number).catch(() => null);
      if (existing) {
        loginExisting(existing);
        return;
      }
      if (!name.trim()) {
        setError("First time here — tell us your name too.");
        setBusy(false);
        return;
      }
      await login({
        mobile_number: number,
        legal_name: name.trim(),
        provider: "MTN",
        is_agent: isAgent,
        merchant_category: isAgent ? "agent" : null,
      });
    } catch (err) {
      setError(err?.response?.data?.detail || "Something went wrong — try again.");
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
          type="tel"
          placeholder="Mobile number (e.g. 0977123456)"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
        <input
          className="field"
          placeholder="Your name (only needed the first time)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, marginBottom: 16 }}>
          <input type="checkbox" checked={isAgent} onChange={(e) => setIsAgent(e.target.checked)} />
          I'm registering as a MoMo agent
        </label>

        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

        <button className="btn-primary" disabled={busy}>
          {busy ? "One moment…" : "Continue"}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 20, fontSize: 12 }}>
        Already used Lipila? Just enter your number — we'll recognize you,
        no password needed. This is a prototype identity, not a bank login.
      </p>
    </div>
  );
}
