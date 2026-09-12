import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { QR } from "../api/client";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [staticQr, setStaticQr] = useState(null);

  useEffect(() => {
    if (user) QR.getStatic(user.id).then(setStaticQr);
  }, [user]);

  return (
    <div className="screen">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Hi, {user.nickname || user.legal_name.split(" ")[0]}</h1>
          <p className="muted">
            ···{user.mobile_number.slice(-3)} · {user.provider}
            {user.is_merchant && <span className="tag">Merchant</span>}
            {user.is_agent && <span className="tag">Agent</span>}
          </p>
        </div>
        <button className="btn-secondary" style={{ width: "auto", padding: "6px 10px", fontSize: 12 }} onClick={logout}>
          Switch
        </button>
      </div>

      <div className="disclaimer-box">
        Lipila never holds your money. Every payment moves directly through {user.provider} MoMo.
      </div>

      <div className="card center-col">
        <h3>Your QR</h3>
        <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
          Print or screenshot this — it never expires.
        </p>
        {staticQr && (
          <div className="qr-frame">
            <img src={staticQr.qr_image} alt="Your static QR code" width={180} height={180} />
          </div>
        )}
      </div>

      <h2 style={{ marginTop: 20 }}>Quick actions</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
        <ActionButton label="Scan to pay" icon="📷" onClick={() => navigate("/scan")} />
        <ActionButton label="Request payment" icon="🧾" onClick={() => navigate("/request")} />
        <ActionButton label="Bong (nearby)" icon="📡" onClick={() => navigate("/bong")} />
        <ActionButton label="Favorites" icon="⭐" onClick={() => navigate("/favorites")} />
        {(user.is_agent) && (
          <ActionButton label="Agent tools" icon="🏧" onClick={() => navigate("/agent")} full />
        )}
      </div>
    </div>
  );
}

function ActionButton({ label, icon, onClick, full }) {
  return (
    <button
      onClick={onClick}
      className="card"
      style={{
        gridColumn: full ? "1 / -1" : "auto",
        border: "1px solid var(--line)", textAlign: "left", background: "var(--paper)",
        display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
    </button>
  );
}
