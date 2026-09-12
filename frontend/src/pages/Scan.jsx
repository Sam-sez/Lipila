import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { QR } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PayConfirm from "../components/PayConfirm";

export default function Scan() {
  const { user } = useAuth();
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState(null); // { payee, amount, amountLocked, method }
  const [manualToken, setManualToken] = useState("");

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScan = async () => {
    setError("");
    setScanning(true);
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        async (decodedText) => {
          await scanner.stop();
          setScanning(false);
          handleDecoded(decodedText);
        },
        () => {} // ignore per-frame scan failures
      );
    } catch (err) {
      setScanning(false);
      setError("Camera unavailable — check browser permissions, or enter a code manually below.");
    }
  };

  const stopScan = async () => {
    if (scannerRef.current) await scannerRef.current.stop().catch(() => {});
    setScanning(false);
  };

  const handleDecoded = async (text) => {
    // Expected formats: lipila://static/<token>  or  lipila://dynamic/<token>
    const match = text.match(/lipila:\/\/(static|dynamic)\/([\w-]+)/);
    if (!match) {
      setError("That doesn't look like a Lipila QR code.");
      return;
    }
    const [, kind, token] = match;
    await resolveToken(kind, token);
  };

  const resolveToken = async (kind, token) => {
    setError("");
    try {
      if (kind === "static") {
        const identity = await QR.resolveStatic(token);
        setPayment({ payee: identity, amount: "", amountLocked: false, method: "static_qr" });
      } else {
        const data = await QR.resolveDynamic(token);
        setPayment({ payee: data.payee, amount: data.amount, amountLocked: true, method: "dynamic_qr" });
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not resolve this QR code — it may have expired.");
    }
  };

  const submitManual = () => {
    if (!manualToken.trim()) return;
    // Heuristic: dynamic tokens are created via /qr/dynamic; we don't know
    // kind from a bare token, so try static first, then dynamic.
    resolveManual(manualToken.trim());
  };

  const resolveManual = async (token) => {
    setError("");
    try {
      const identity = await QR.resolveStatic(token);
      setPayment({ payee: identity, amount: "", amountLocked: false, method: "static_qr" });
      return;
    } catch (_) {}
    try {
      const data = await QR.resolveDynamic(token);
      setPayment({ payee: data.payee, amount: data.amount, amountLocked: true, method: "dynamic_qr" });
    } catch (err) {
      setError("No matching QR code found for that token.");
    }
  };

  return (
    <div className="screen">
      <h2>Scan to pay</h2>
      <p className="muted">Point your camera at a Static or Dynamic Lipila QR code.</p>

      <div className="card center-col" style={{ marginTop: 16 }}>
        <div id="qr-reader" style={{ width: "100%", maxWidth: 320 }} />
        {!scanning ? (
          <button className="btn-primary" onClick={startScan} style={{ marginTop: 12 }}>
            Open camera
          </button>
        ) : (
          <button className="btn-secondary" onClick={stopScan} style={{ marginTop: 12 }}>
            Stop scanning
          </button>
        )}
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: 14 }}>No camera? Enter a code</h3>
        <p className="muted" style={{ fontSize: 12 }}>
          Useful for desktop demos — paste a static_qr_token or dynamic qr_token from the API.
        </p>
        <input className="field" value={manualToken} onChange={(e) => setManualToken(e.target.value)} placeholder="QR token" />
        <button className="btn-secondary" onClick={submitManual}>Resolve</button>
      </div>

      {payment && (
        <PayConfirm
          payer={{ user_id: user.id, provider: user.provider }}
          payee={payment.payee}
          amount={payment.amount}
          amountLocked={payment.amountLocked}
          method={payment.method}
          onClose={() => setPayment(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
