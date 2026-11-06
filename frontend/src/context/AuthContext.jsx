import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("foodloop_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem("foodloop_token") || null;
  });
  const [loading, setLoading] = useState(true);

  // Validate existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("foodloop_token");
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res?.data?.user) {
            setUser(res.data.user);
            localStorage.setItem("foodloop_user", JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn("Session expired or invalid token:", err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("foodloop_token", newToken);
    localStorage.setItem("foodloop_user", JSON.stringify(newUser));
    return newUser;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("foodloop_token", newToken);
    localStorage.setItem("foodloop_user", JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("foodloop_token");
    localStorage.removeItem("foodloop_user");
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("foodloop_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
