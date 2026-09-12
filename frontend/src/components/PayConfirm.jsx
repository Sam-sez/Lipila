import { useState } from "react";
import { Payments } from "../api/client";

const STEPS = { IDENTITY: "identity", BIOMETRIC: "biometric", PIN: "pin", PROCESSING: "processing", DONE: "done" };

/**
 * Props:
 *  payer, payee (DisplayIdentity-shaped: {user_id, name, verified_number_suffix, photo_url})
 *  amount (number) - if amountLocked, user can't edit it (Dynamic QR / Bong-confirmed amount)
 *  amountLocked (bool)
 *  method: "static_qr" | "dynamic_qr" | "bong" | "favorite"
 *  onClose(), onSuccess(transaction)
 */
export default function PayConfirm({ payer, payee, amount: initialAmount, amountLocked, method, onClose, onSuccess }) {
  const [step, setStep] = useState(STEPS.IDENTITY);
  const [amount, setAmount] = useState(initialAmount || "");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const [saveFavorite, setSaveFavorite] = useState(true);
  const [error, setError] = useState("");
  const [txn, setTxn] = useState(null);

  const proceedToBiometric = () => {
    if (!amount || Number(amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setError("");
    setStep(STEPS.BIOMETRIC);
  };

  const simulateBiometric = () => {
    // Real build: navigator.credentials.get() via WebAuthn, or native Face
    // ID/fingerprint on mobile. This never touches provider funds — it only
    // authorizes the REQUEST inside Lipila.
    setTimeout(() => setStep(STEPS.PIN), 700);
  };

  const submitPin = async () => {
    if (pin.length !== 4) {
      setError("Enter your 4-digit PIN.");
      return;
    }
    // This PIN is never sent to Lipila's backend — it's discarded right
    // here. In production this step IS the provider's own native prompt
    // (MTN/Airtel), not a Lipila UI at all.
    setPin("");
    setError("");
    setStep(STEPS.PROCESSING);
    try {
      const result = await Payments.confirm({
        payer_id: payer.user_id,
        payee_id: payee.user_id,
        amount: Number(amount),
        method,
        note: note || null,
        save_as_favorite: saveFavorite,
      });
      // Poll once for mock-provider resolution
      let final = result;
      for (let i = 0; i < 3 && final.status === "pending"; i++) {
        await new Promise((r) => setTimeout(r, 500));
        final = await Payments.status(result.id);
      }
      setTxn(final);
      setStep(STEPS.DONE);
      if (final.status === "successful") onSuccess?.(final);
    } catch (err) {
      setError(err?.response?.data?.detail || "Payment failed to process.");
      setStep(STEPS.PIN);
    }
  };

  return (
    <div style={overlayStyle}>
      <div className="card" style={{ maxWidth: 420, width: "100%", background: "var(--paper)" }}>
        {step !== STEPS.DONE && (
          <button onClick={onClose} className="btn-secondary" style={{ width: "auto", padding: "4px 10px", fontSize: 12, marginBottom: 12 }}>
            Cancel
          </button>
        )}

        {(step === STEPS.IDENTITY) && (
          <>
            <h3>You're paying</h3>
            <div className="identity-row">
              <div className="avatar">{payee.name?.[0]?.toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{payee.name}</div>
                <div className="verified-badge">✓ Verified · ···{payee.verified_number_suffix}</div>
              </div>
            </div>
            <label className="muted">Amount (ZMW)</label>
            <input
              className="field"
              type="number"
              value={amount}
              disabled={amountLocked}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            <label className="muted">Note (optional)</label>
            <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. lunch, transport" />
            {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
            <button className="btn-primary" onClick={proceedToBiometric}>Continue</button>
          </>
        )}

        {step === STEPS.BIOMETRIC && (
          <div className="center-col" style={{ padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
            <h3>Confirm it's you</h3>
            <p className="muted">Face ID / fingerprint authorizes this request inside Lipila only.</p>
            <button className="btn-primary" onClick={simulateBiometric} style={{ marginTop: 12 }}>
              Confirm with biometrics
            </button>
          </div>
        )}

        {step === STEPS.PIN && (
          <div className="center-col" style={{ padding: "10px 0" }}>
            <h3>{payer.provider || "MTN"} MoMo PIN</h3>
            <p className="muted">
              Sent by your provider directly, not Lipila. In mock mode this PIN
              is discarded here and never transmitted anywhere.
            </p>
            <input
              className="field"
              type="password"
              maxLength={4}
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              style={{ textAlign: "center", letterSpacing: 6, fontSize: 20 }}
            />
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginBottom: 12 }}>
              <input type="checkbox" checked={saveFavorite} onChange={(e) => setSaveFavorite(e.target.checked)} />
              Save {payee.name} as a favorite
            </label>
            {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
            <button className="btn-primary" onClick={submitPin}>Authorize payment</button>
          </div>
        )}

        {step === STEPS.PROCESSING && (
          <div className="center-col" style={{ padding: "30px 0" }}>
            <p>Processing with {payer.provider || "your provider"}…</p>
          </div>
        )}

        {step === STEPS.DONE && txn && (
          <div className="center-col" style={{ padding: "10px 0" }}>
            <div style={{ fontSize: 40 }}>{txn.status === "successful" ? "✅" : "⚠️"}</div>
            <h3>{txn.status === "successful" ? "Payment sent" : "Payment failed"}</h3>
            <p className="ledger-amount" style={{ fontSize: 24 }}>K{txn.amount.toFixed(2)}</p>
            <p className="muted">to {payee.name}</p>
            <button className="btn-primary" onClick={onClose} style={{ marginTop: 12 }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
  display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100,
  padding: 12,
};
