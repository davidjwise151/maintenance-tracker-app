import React, { useState, useCallback, useEffect } from "react";
import { formatDateMMDDYYYY } from "./utils/dateUtils";
import AuthForm from "./AuthForm";
import MaintenanceTaskLog from "./MaintenanceTaskLog";
import { ToastManagerProvider } from "./ToastManager";

/**
 * Main application component.
 * Handles authentication UI and testing access to a protected backend route.
 *
 * Environment Variables:
 * - REACT_APP_API_URL: Backend API base URL
 */
function App() {
  /**
   * Tracks login status
   */
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  // Validate token on app load
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      setCheckingToken(false);
      return;
    }
    const apiBase = process.env.REACT_APP_API_URL || "";
    fetch(`${apiBase}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem("token");
          setIsLoggedIn(false);
        } else {
          setIsLoggedIn(true);
        }
      })
      .catch(() => {
        sessionStorage.removeItem("token");
        setIsLoggedIn(false);
      })
      .finally(() => setCheckingToken(false));
  }, []);
  /**
   * State for displaying the protected route message
   */
  const [protectedMsg, setProtectedMsg] = useState("");
  /**
   * State for loading indicator when fetching protected route
   */
  const [loading, setLoading] = useState(false);

  /**
   * State for reminders (upcoming/late tasks)
   */
  const [reminders, setReminders] = useState<{ upcoming: any[]; late: any[] }>({ upcoming: [], late: [] });
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [remindersMinimized, setRemindersMinimized] = useState(false);

  /**
   * Handles sign out
   * Removes JWT token and resets state
   */
  const handleSignOut = useCallback(() => {
    sessionStorage.removeItem("token");
    setIsLoggedIn(false);
    setProtectedMsg("");
  }, []);

  /**
   * Attempts to access a protected backend route.
   * - Sends JWT from localStorage in the Authorization header.
   * - Handles missing token, unauthorized, and network errors.
   * - Displays backend response or error message.
   */
  const fetchProtected = useCallback(async () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setProtectedMsg("Unauthorized: No token found");
      return;
    }
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_URL || "";
      const res = await fetch(`${apiBase}/api/protected`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        setProtectedMsg("Unauthorized");
        setLoading(false);
        return;
      }
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        setProtectedMsg("Error: Invalid response from server");
        setLoading(false);
        return;
      }
      setProtectedMsg(data.message || "No message returned");
    } catch (error) {
      setProtectedMsg("Network error: Unable to reach server");
    } finally {
      setLoading(false);
    }
  }, []);

  // Handles login success from AuthForm
  /**
   * Called when AuthForm login succeeds
   */
  // Track user role for role-based UI
  const [userRole, setUserRole] = useState<string>("");
  const handleLoginSuccess = useCallback((userInfo?: { role?: string }) => {
    setIsLoggedIn(true);
    if (userInfo && userInfo.role) {
      setUserRole(userInfo.role);
      sessionStorage.setItem("role", userInfo.role);
    } else {
      setUserRole("");
      sessionStorage.removeItem("role");
    }
  }, []);

  // Reminders fetch logic as a reusable function
  const fetchReminders = useCallback(async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return;
    setRemindersLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_URL || "";
      const res = await fetch(`${apiBase}/api/tasks/upcoming`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReminders({ upcoming: data.upcoming || [], late: data.late || [] });
      } else {
        setReminders({ upcoming: [], late: [] });
      }
    } catch {
      setReminders({ upcoming: [], late: [] });
    } finally {
      setRemindersLoading(false);
    }
  }, []);

  // Fetch reminders when logged in
  useEffect(() => {
    if (isLoggedIn) fetchReminders();
  }, [isLoggedIn, fetchReminders]);

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
          {/* Logo and phrase at top */}
          <header style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2em" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <svg width="48" height="48" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.10))" }}>
                <circle cx="22" cy="22" r="20" fill="#222" />
                <path d="M14 28c0-6 8-6 8-12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="22" cy="16" r="2.5" fill="#fff" />
              </svg>
              <span style={{ fontFamily: 'SF Pro Display, Helvetica Neue, Arial, sans-serif', fontWeight: 700, fontSize: '2.4rem', letterSpacing: '-0.03em', color: '#222', textShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                Maintainer
              </span>
            </div>
            <span style={{ fontFamily: 'SF Pro Text, Helvetica Neue, Arial, sans-serif', fontWeight: 400, fontSize: '1.08rem', color: '#888', marginTop: 4, letterSpacing: '-0.01em' }}>
              Built for Reliability
            </span>
          </header>
          {/* Reminders Section - collapsible, directly below logo/phrase, above Create New Task */}
          {isLoggedIn && (
            <div style={{ marginBottom: "2em", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: remindersMinimized ? "#f5f5f7" : "#f5f5f7", borderRadius: 10, boxShadow: remindersMinimized ? "none" : "0 2px 8px rgba(0,0,0,0.04)", padding: "0.7em 1.2em", marginBottom: remindersMinimized ? 0 : 12, border: "1px solid #e0e0e0" }}>
                <span style={{ fontWeight: 600, fontSize: "1.08rem", color: "#222", fontFamily: 'SF Pro Text, Helvetica Neue, Arial, sans-serif', letterSpacing: '-0.01em' }}>
                  Reminders
                </span>
                <button
                  aria-label={remindersMinimized ? "Show reminders" : "Hide reminders"}
                  onClick={() => setRemindersMinimized(m => !m)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#888",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    padding: 0,
                    marginLeft: 8,
                    borderRadius: 6,
                    transition: "background 0.2s"
                  }}
                >
                  {remindersMinimized ? "▸" : "▾"}
                </button>
              </div>
              {!remindersMinimized && (
                <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.03)", padding: "0.7em 1.2em", fontFamily: 'SF Pro Text, Helvetica Neue, Arial, sans-serif', fontSize: "1rem", color: "#222", border: "1px solid #e0e0e0" }}>
                  {remindersLoading ? (
                    <div style={{ color: "#888" }}>Loading reminders...</div>
                  ) : reminders.upcoming.length === 0 && reminders.late.length === 0 ? (
                    <div style={{ color: "#888" }}>No upcoming or late tasks.</div>
                  ) : (
                    <>
                      {reminders.late.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ color: "#e74c3c", fontWeight: 700, fontSize: "1.08rem", marginBottom: 2, fontFamily: 'SF Pro Text, Helvetica Neue, Arial, sans-serif' }}>Late Tasks:</div>
                          <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc" }}>
                            {reminders.late.map((task, idx) => (
                              <li key={task.id || idx} style={{ marginBottom: 2, color: "#444", fontWeight: 500, fontSize: "0.98rem" }}>{task.title} <span style={{ color: "#888", fontWeight: 400 }}>(Due: {task.dueDate ? formatDateMMDDYYYY(new Date(task.dueDate)) : "N/A"})</span></li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {reminders.upcoming.length > 0 && (
                        <div>
                          <div style={{ color: "#2980b9", fontWeight: 700, fontSize: "1.08rem", marginBottom: 2, fontFamily: 'SF Pro Text, Helvetica Neue, Arial, sans-serif' }}>Upcoming Tasks:</div>
                          <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc" }}>
                            {reminders.upcoming.map((task, idx) => (
                              <li key={task.id || idx} style={{ marginBottom: 2, color: "#444", fontWeight: 500, fontSize: "0.98rem" }}>{task.title} <span style={{ color: "#888", fontWeight: 400 }}>(Due: {task.dueDate ? formatDateMMDDYYYY(new Date(task.dueDate)) : "N/A"})</span></li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          <main>
            {/* If not logged in, show authentication form */}
            {checkingToken ? (
              <div style={{ textAlign: "center", marginTop: "4em", fontSize: "1.2em", color: "#888" }}>Checking authentication...</div>
            ) : !isLoggedIn ? (
              <>
                <AuthForm onLoginSuccess={handleLoginSuccess} />
                <button onClick={fetchProtected} disabled={loading} style={{ marginTop: 12, minWidth: 160 }}>
                  {loading ? "Testing..." : "Test Protected Route"}
                </button>
                <div style={{ marginTop: 8, color: protectedMsg.startsWith("Unauthorized") || protectedMsg.startsWith("Error") ? "#e74c3c" : "#222" }}>
                  {protectedMsg}
                </div>
              </>
            ) : (
              <MaintenanceTaskLog refreshReminders={fetchReminders} userRole={userRole} />
            )}
          </main>
        </div>
      </div>
    </ToastManagerProvider>
  );
}

export default App;