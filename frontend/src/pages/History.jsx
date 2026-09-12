import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Payments } from "../api/client";

const METHOD_LABELS = {
  static_qr: "Static QR",
  dynamic_qr: "Dynamic QR",
  bong: "Bong",
  favorite: "Favorite",
};

export default function History() {
  const { user } = useAuth();
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Payments.history(user.id).then((t) => { setTxns(t); setLoading(false); });
  }, [user]);

  return (
    <div className="screen">
      <h2>History</h2>
      <p className="muted">Doubles as a lightweight ledger — every note you've attached lives here.</p>

      {loading && <p className="muted">Loading…</p>}

      {!loading && txns.length === 0 && (
        <div className="card center-col" style={{ marginTop: 20 }}>
          <div style={{ fontSize: 32 }}>🧾</div>
          <h3>No transactions yet</h3>
          <p className="muted">Payments you send or receive will show up here.</p>
        </div>
      )}

      {txns.map((t) => {
        const isOutgoing = t.payer_id === user.id;
        return (
          <div key={t.id} className="ledger-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {isOutgoing ? "Sent" : "Received"}
                {t.auto_tag && <span className="tag">{t.auto_tag}</span>}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {t.note || "No note"} · {METHOD_LABELS[t.method] || t.method}
              </div>
              <span className={`status-pill status-${t.status}`}>{t.status}</span>
            </div>
            <div className="ledger-amount" style={{ color: isOutgoing ? "var(--danger)" : "var(--success)" }}>
              {isOutgoing ? "-" : "+"}K{t.amount.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
