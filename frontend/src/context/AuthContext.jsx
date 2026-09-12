import { createContext, useContext, useState, useEffect } from "react";
import { Users } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem("lipila_user_id");
    if (savedId) {
      Users.get(savedId)
        .then(setUser)
        .catch(() => localStorage.removeItem("lipila_user_id"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (payload) => {
    const created = await Users.create(payload);
    localStorage.setItem("lipila_user_id", created.id);
    setUser(created);
    return created;
  };

  const logout = () => {
    localStorage.removeItem("lipila_user_id");
    setUser(null);
  };

  const refreshUser = async () => {
    if (user) setUser(await Users.get(user.id));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
