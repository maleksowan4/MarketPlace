"use client"; // Tells Next.js that this file uses client-side interactive React hooks

import { createContext, useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ==========================================
// BLOCK 1: Context Creation
// ==========================================
const AuthContext = createContext();

// ==========================================
// BLOCK 2: Provider & Session States
// ==========================================
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Holds user details: { UserID, Username, Email, RoleName }
  const [token, setToken] = useState(null); // Holds JWT token string
  const [walletBalance, setWalletBalance] = useState(0); // Holds wallet balance
  const [loading, setLoading] = useState(true); // Tracks initial session load
  const router = useRouter();

  // ==========================================
  // BLOCK 3: Restore Session on Mount
  // ==========================================
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem("token");
      
      if (savedToken) {
        try {
          // 1. Fetch user profile to verify the token is valid via API Gateway
          const profileRes = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: {
              "Authorization": `Bearer ${savedToken}`
            }
          });

          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setUser(profileData);
            setToken(savedToken);

            // 2. Fetch the user's starting wallet balance via API Gateway
            const walletRes = await fetch(`${API_BASE_URL}/wallet`, {
              headers: {
                "Authorization": `Bearer ${savedToken}`
              }
            });
            if (walletRes.ok) {
              const walletData = await walletRes.json();
              setWalletBalance(walletData.balance ?? walletData.Balance ?? 0);
            }
          } else {
            // Token has expired or is invalid
            localStorage.removeItem("token");
          }
        } catch (err) {
          console.error("Failed to verify token on load:", err);
        }
      }
      setLoading(false); // Stop loading indicator once check is done
    };

    restoreSession();
  }, []);

  // ==========================================
  // BLOCK 4: Session Control Helper Functions
  // ==========================================

  // 1. Fetch wallet balance from the database via API Gateway
  const fetchBalance = async (tokenOverride = token) => {
    const activeToken = tokenOverride || token;
    if (!activeToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/wallet`, {
        headers: {
          "Authorization": `Bearer ${activeToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance ?? data.Balance ?? 0);
      }
    } catch (err) {
      console.error("Failed to update wallet balance:", err);
    }
  };

  // 2. Log in a user (saves token and user data)
  const login = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
    fetchBalance(newToken); // Instantly pull balance
  };

  // 3. Log out a user (wipes credentials)
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setWalletBalance(0);
    router.push("/login");
  };

  // ==========================================
  // BLOCK 5: Render Provider Wrapper
  // ==========================================
  return (
    <AuthContext.Provider value={{ user, token, walletBalance, loading, login, logout, fetchBalance, updateWalletBalance: fetchBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to make it super easy for pages to access this context
export function useAuth() {
  return useContext(AuthContext);
}
