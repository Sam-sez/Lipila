import { useAuth } from "../context/AuthContext";

export default function TopBar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <header className="top-bar">
      <span className="top-bar-brand">Lipila</span>
      <button
        className="top-bar-avatar"
        onClick={() => {
          if (confirm("Switch account? You can log back in with your number anytime.")) logout();
        }}
        title="Switch account"
      >
        {(user.nickname || user.legal_name)?.[0]?.toUpperCase()}
      </button>
    </header>
  );
}
