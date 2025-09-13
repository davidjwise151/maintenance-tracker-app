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
        <div style={{ maxWidth: 600, margin: "4em auto 2em auto", padding: "2em", border: "1px solid #ccc", borderRadius: 8, background: "#fff" }}>
          <header style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "2em" }}>
            <h1>Maintenance Tracker</h1>
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