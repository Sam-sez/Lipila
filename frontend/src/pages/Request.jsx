import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { QR } from "../api/client";

export default function Request() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [qr, setQr] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!qr || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [qr, secondsLeft]);

  const generate = async () => {
    setError("");
    if (!amount || Number(amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    try {
      const dyn = await QR.createDynamic(user.id, Number(amount), note || null);
      const img = await QR.getDynamicImage(dyn.qr_token);
      setQr({ ...dyn, image: img.qr_image });
      setSecondsLeft(dyn.expires_in_seconds);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not generate QR.");
    }
  };

  const expired = qr && secondsLeft <= 0;

  return (
    <div className="screen">
      <h2>Request a payment</h2>
      <p className="muted">Generates a Dynamic QR with the exact amount locked in — expires in a few minutes.</p>

      {!qr && (
        <div className="card" style={{ marginTop: 16 }}>
          <label className="muted">Amount (ZMW)</label>
          <input className="field" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          <label className="muted">What's it for? (optional)</label>
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. market stall order" />
          {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
          <button className="btn-primary" onClick={generate}>Generate QR</button>
        </div>
      )}

      {qr && (
        <div className="card center-col" style={{ marginTop: 16 }}>
          {!expired ? (
            <>
              <div className="qr-frame">
                <img src={qr.image} alt="Dynamic payment QR" width={220} height={220} />
              </div>
              <p style={{ marginTop: 12, fontSize: 22, fontWeight: 700 }}>K{qr.amount.toFixed(2)}</p>
              <p className="muted">Expires in {secondsLeft}s</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32 }}>⏱️</div>
              <h3>This QR has expired</h3>
              <p className="muted">Generate a new one if the payer hasn't scanned yet.</p>
            </>
          )}
          <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => { setQr(null); setAmount(""); setNote(""); }}>
            {expired ? "Generate new QR" : "Cancel request"}
          </button>
        </div>
      )}
    </div>
  );
}
