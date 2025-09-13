import React, { useState } from "react";
import AuthForm from "./AuthForm";
import MaintenanceTaskLog from "./MaintenanceTaskLog";
import { ToastManagerProvider } from "./ToastManager";

/**
 * Main application component.
 * Handles authentication UI and testing access to a protected backend route.
 */
function App() {
  // Handles sign out
  const handleSignOut = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setProtectedMsg("");
  };
  // State for displaying the protected route message
  // State for displaying the protected route message
  const [protectedMsg, setProtectedMsg] = useState("");
  // Tracks login status
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  /**
   * Attempts to access a protected backend route.
   * - Sends JWT from localStorage in the Authorization header.
   * - Handles missing token, unauthorized, and network errors.
   * - Displays backend response or error message.
   */
  const fetchProtected = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setProtectedMsg("Unauthorized: No token found");
      return;
    }
    try {
  const apiBase = process.env.REACT_APP_API_URL || "";
  const res = await fetch(`${apiBase}/api/protected`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        setProtectedMsg("Unauthorized");
        return;
      }
      const data = await res.json();
      setProtectedMsg(data.message || "No message returned");
    } catch (error) {
      setProtectedMsg("Network error: Unable to reach server");
    }
  };

  // Handles login success from AuthForm
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <ToastManagerProvider>
      <div style={{ position: "relative", minHeight: "100vh", background: "#f9f9f9" }}>
        {isLoggedIn && (
          <button
            onClick={handleSignOut}
            className="task-log-button"
            style={{
              position: "absolute",
              top: 24,
              right: 32,
              minWidth: 120,
              height: 36,
              fontWeight: "bold",
              fontSize: "1rem",
              background: "#e74c3c",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              cursor: "pointer",
              zIndex: 1000
            }}
          >
            Sign Out
          </button>
        )}
        <div style={{ maxWidth: 600, margin: "4em auto 2em auto", padding: "2em", borderRadius: 16, background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <header style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2em" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.10))" }}>
                <circle cx="22" cy="22" r="20" fill="#222" />
                <path d="M14 28c0-6 8-6 8-12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="22" cy="16" r="2.5" fill="#fff" />
              </svg>
              <span style={{ fontFamily: 'SF Pro Display, Helvetica Neue, Arial, sans-serif', fontWeight: 700, fontSize: '2.2rem', letterSpacing: '-0.03em', color: '#222', textShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                Maintainer
              </span>
            </div>
            <span style={{ fontFamily: 'SF Pro Text, Helvetica Neue, Arial, sans-serif', fontWeight: 400, fontSize: '1.05rem', color: '#888', marginTop: 4, letterSpacing: '-0.01em' }}>
              Maintenance, organized beautifully
            </span>
          </header>
          <main>
            {/* If not logged in, show authentication form */}
            {!isLoggedIn ? (
              <>
                <AuthForm onLoginSuccess={handleLoginSuccess} />
                <button onClick={fetchProtected}>Test Protected Route</button>
                <div>{protectedMsg}</div>
              </>
            ) : (
              <MaintenanceTaskLog />
            )}
          </main>
        </div>
      </div>
    </ToastManagerProvider>
  );
}

export default App;