import { createContext, useContext, useEffect, useState } from "react";
import API from "../api/API";

const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const currentUser = await API.getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  async function login(username, password) {
    const loggedUser = await API.login(username, password);
    setUser(loggedUser);
    return loggedUser;
  }

  async function logout() {
    await API.logout();
    setUser(null);
  }

  const value = {
    user,
    loggedIn: Boolean(user),
    checkingSession,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  return useContext(AuthContext);
}

export { AuthProvider, useAuth };