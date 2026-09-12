import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Bong as BongAPI } from "../api/client";
import PayConfirm from "../components/PayConfirm";

function randomToken() {
  return "sess-" + Math.random().toString(36).slice(2, 10);
}

export default function BongPage() {
  const { user } = useAuth();
  const [mySession] = useState(randomToken());
  const [announced, setAnnounced] = useState(false);
  const [peerToken, setPeerToken] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const openBong = async () => {
    setError("");
    try {
      await BongAPI.announce(user.id, mySession);
      setAnnounced(true);
    } catch (err) {
      setError("Could not start Bong.");
    }
  };

  const scanForNearby = async () => {
    setError("");
    if (!peerToken.trim()) {
      setError("Paste the other person's Bong code from their screen.");
      return;
    }
    try {
      // Simulated RSSI since real BLE signal strength isn't available in-browser.
      const result = await BongAPI.candidates([{ detected_session_token: peerToken.trim(), rssi: -45 }]);
      setCandidates(result.candidates || []);
    } catch (err) {
      setError("That Bong code wasn't found or has expired.");
    }
  };

  const pickCandidate = async (sessionToken) => {
    setError("");
    try {
      const identity = await BongAPI.reveal(sessionToken);
      setSelected(identity);
    } catch (err) {
      setError("Could not confirm identity — the session may have expired.");
    }
  };

  return (
    <div className="screen">
      <h2>Bong</h2>
      <p className="muted">Pay someone standing near you — no scanning, no typing a number.</p>

      <div className="disclaimer-box">
        Demo note: real Bong uses Bluetooth to sense nearby phones automatically.
        Browsers can't do that kind of open proximity scanning — only a native
        app can. This screen runs the exact same backend matching and
        identity-reveal logic, but you'll paste in the other person's code by
        hand to simulate detection.
      </div>

      {!announced ? (
        <button className="btn-primary" onClick={openBong}>Open Bong</button>
      ) : (
        <div className="card">
          <h3 style={{ fontSize: 14 }}>Your Bong code (share this)</h3>
          <p style={{ fontFamily: "monospace", fontSize: 16, background: "var(--paper-dim)", padding: 8, borderRadius: 6 }}>
            {mySession}
          </p>
          <p className="muted" style={{ fontSize: 12 }}>Expires in ~60 seconds, whether or not a match happens.</p>
        </div>
      )}

      {announced && candidates.length === 0 && (
        <div className="card">
          <label className="muted">Enter the other person's Bong code</label>
          <input className="field" value={peerToken} onChange={(e) => setPeerToken(e.target.value)} placeholder="sess-xxxxxxxx" />
          <button className="btn-primary" onClick={scanForNearby}>Find nearby</button>
        </div>
      )}

      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

      {candidates.length > 0 && !selected && (
        <div className="card">
          <h3 style={{ fontSize: 14 }}>Closest match</h3>
          <p className="muted" style={{ fontSize: 12 }}>Not revealed yet — confirm before we show a name.</p>
          {candidates.map((c) => (
            <button
              key={c.session_token}
              className="btn-secondary"
              style={{ marginBottom: 8 }}
              onClick={() => pickCandidate(c.session_token)}
            >
              {c.estimated_distance_rank === 1 ? "Closest device" : `Nearby device #${c.estimated_distance_rank}`}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <PayConfirm
          payer={{ user_id: user.id, provider: user.provider }}
          payee={selected}
          amount=""
          amountLocked={false}
          method="bong"
          onClose={() => setSelected(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
