import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (error) {
        console.error('Failed to fetch user profile', error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
