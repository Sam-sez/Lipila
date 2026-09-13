import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import TopBar from "./components/TopBar";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Scan from "./pages/Scan";
import Request from "./pages/Request";
import Bong from "./pages/Bong";
import Favorites from "./pages/Favorites";
import History from "./pages/History";
import AgentTools from "./pages/AgentTools";

function Shell({ children }) {
  return <div className="app-shell">{children}</div>;
}

function BottomNav() {
  const items = [
    { to: "/", icon: "🏠", label: "Home", end: true },
    { to: "/scan", icon: "📷", label: "Scan" },
    { to: "/history", icon: "🧾", label: "History" },
    { to: "/favorites", icon: "⭐", label: "Favorites" },
  ];
  return (
    <nav className="bottom-nav">
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
          <span className="nav-icon">{i.icon}</span>
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}

function AuthGate({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="screen">Loading…</div>;
  if (!user) return <Login />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="/request" element={<Request />} />
      <Route path="/bong" element={<Bong />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/history" element={<History />} />
      <Route path="/agent" element={<AgentTools />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell>
          <AuthGate>
            <TopBar />
            <AppRoutes />
            <BottomNav />
          </AuthGate>
        </Shell>
      </BrowserRouter>
    </AuthProvider>
  );
}
