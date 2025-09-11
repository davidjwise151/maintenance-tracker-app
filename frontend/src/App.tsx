import React, { useState } from "react";
import AuthForm from "./AuthForm";

/**
 * Main application component.
 * Handles authentication UI and testing access to a protected backend route.
 */
function App() {
  // State for displaying the protected route message
  const [protectedMsg, setProtectedMsg] = useState("");

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

  return (
    <div>
      {/* Authentication form for login and registration */}
      <AuthForm />
      {/* Button to test access to protected backend route */}
      <button onClick={fetchProtected}>Test Protected Route</button>
      {/* Display the result of the protected route request */}
      <div>{protectedMsg}</div>
    </div>
  );
}

export default App;