import { useState, useEffect, useCallback } from "react";
 // coment //
// ─── Storage helpers ───────────────────────────────────────────────────────────
const STORAGE_KEY = "user";
 
const persist = (user) =>
  user
    ? localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    : localStorage.removeItem(STORAGE_KEY);
 
const restore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
 

export function useAuth() {
  const [user, setUser] = useState(restore);

  useEffect(() => {
    persist(user);
  }, [user]);

  const login = useCallback((userData) => setUser(userData), []);
  const logout = useCallback(() => setUser(null), []);
  const updateUser = useCallback(
    (partial) => setUser((prev) => (prev ? { ...prev, ...partial } : prev)),
    []
  );

  return { user, isLoggedIn: Boolean(user), login, logout, updateUser };
}