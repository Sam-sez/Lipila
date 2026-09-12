import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Favorites as FavAPI } from "../api/client";
import PayConfirm from "../components/PayConfirm";

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    FavAPI.list(user.id).then((f) => { setFavorites(f); setLoading(false); });
  }, [user]);

  const removeFavorite = async (savedUserId) => {
    await FavAPI.remove(user.id, savedUserId);
    setFavorites((f) => f.filter((x) => x.user_id !== savedUserId));
  };

  return (
    <div className="screen">
      <h2>Favorites</h2>
      <p className="muted">Skip discovery, never skip confirmation — biometric + PIN still apply.</p>

      {loading && <p className="muted">Loading…</p>}

      {!loading && favorites.length === 0 && (
        <div className="card center-col" style={{ marginTop: 20 }}>
          <div style={{ fontSize: 32 }}>⭐</div>
          <h3>No favorites yet</h3>
          <p className="muted">After your next payment, Lipila will ask if you'd like to save that person.</p>
        </div>
      )}

      {favorites.map((f) => (
        <div key={f.user_id} className="identity-row" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="avatar">{f.name?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{f.name}</div>
              <div className="verified-badge">✓ ···{f.verified_number_suffix}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" style={{ width: "auto", padding: "8px 14px", fontSize: 13 }} onClick={() => setSelected(f)}>
              Pay
            </button>
            <button className="btn-secondary" style={{ width: "auto", padding: "8px 10px", fontSize: 13 }} onClick={() => removeFavorite(f.user_id)}>
              ✕
            </button>
          </div>
        </div>
      ))}

      {selected && (
        <PayConfirm
          payer={{ user_id: user.id, provider: user.provider }}
          payee={selected}
          amount=""
          amountLocked={false}
          method="favorite"
          onClose={() => setSelected(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
