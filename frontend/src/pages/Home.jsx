import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { QR } from "../api/client";
import jsPDF from "jspdf";

function maskNumber(fullNumber) {
  // Full mask except the last 3 digits — length-accurate, not a fixed guess.
  const visible = fullNumber.slice(-3);
  const hidden = "*".repeat(Math.max(fullNumber.length - 3, 0));
  return hidden + visible;
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staticQr, setStaticQr] = useState(null);

  useEffect(() => {
    if (user) QR.getStatic(user.id).then(setStaticQr);
  }, [user]);

  const displayName = user.nickname || user.legal_name;

  const exportQr = () => {
    if (!staticQr) return;
    const doc = new jsPDF({ unit: "pt", format: [320, 440] });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(46, 21, 3);
    doc.text("Lipila", 160, 44, { align: "center" });
    doc.addImage(staticQr.qr_image, "PNG", 70, 70, 180, 180);
    doc.setFontSize(17);
    doc.text(displayName, 160, 285, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(130, 115, 95);
    doc.text(maskNumber(user.mobile_number), 160, 305, { align: "center" });
    doc.setFontSize(9);
    doc.text("Scan to pay via Lipila", 160, 400, { align: "center" });
    doc.save(`lipila-qr-${displayName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const actions = [
    { label: "Scan to pay", onClick: () => navigate("/scan") },
    { label: "Request payment", onClick: () => navigate("/request") },
    { label: "Bong (nearby)", onClick: () => navigate("/bong") },
    { label: "Favorites", onClick: () => navigate("/favorites") },
  ];
  if (user.is_agent) {
    actions.push({ label: "Agent tools", onClick: () => navigate("/agent"), secondary: true });
  }

  return (
    <div className="screen">
      <h1>Hi, {displayName.split(" ")[0]}</h1>
      <p className="muted">
        {maskNumber(user.mobile_number)} · {user.provider}
        {user.is_agent && <span className="tag">Agent</span>}
      </p>

      <div className="disclaimer-box">
        Lipila never holds your money. Every payment moves directly through {user.provider} MoMo.
      </div>

      <div className="card center-col">
        <h3>Your QR</h3>
        <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
          Print or share this — it never expires.
        </p>
        {staticQr && (
          <>
            <div className="qr-frame">
              <img src={staticQr.qr_image} alt="Your static QR code" width={180} height={180} />
            </div>
            <button className="export-btn" onClick={exportQr}>Export as PDF</button>
          </>
        )}
      </div>

      <h2 style={{ marginTop: 20, marginBottom: 12 }}>Quick actions</h2>
      <div className="action-list">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className={`action-btn${a.secondary ? " action-btn-secondary" : ""}`}
          >
            <span>{a.label}</span>
            <span className="action-btn-arrow">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
