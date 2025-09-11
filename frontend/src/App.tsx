import React, { useState } from "react";
import AuthForm from "./AuthForm";
import CompletedTasksReport from "./CompletedTasksReport";

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
      const res = await fetch("/api/protected", {
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
    <div style={{ maxWidth: 600, margin: "2em auto", padding: "2em", border: "1px solid #ccc", borderRadius: 8 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2em" }}>
        <h1>Maintenance Tracker</h1>
        {isLoggedIn && (
          <button onClick={handleSignOut} style={{ padding: "0.5em 1em" }}>Sign Out</button>
        )}
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
          <CompletedTasksReport />
        )}
      </main>
    </div>
  );
}

export default App;