import React, { useState, useCallback } from "react";
import "./styles/modern-form.css";

type Mode = "login" | "register";
interface AuthFormProps {
  onLoginSuccess?: (userInfo?: { role?: string }) => void;
}
/**
 * AuthForm component handles user login and registration.
 * - Displays a form for email and password input.
 * - Submits to backend API for authentication or registration.
 * - Shows success or error messages.
 * - Stores JWT token in localStorage on successful login.
 */
const AuthForm: React.FC<AuthFormProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Handles form submission for login or registration
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    // Debug log for form values and mode
    console.log("AuthForm submit", { mode, email, password });
    // Basic client-side validation
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      console.log("Email failed regex validation", email);
      setMessage("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      console.log("Password too short", password);
      setMessage("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const endpoint = mode === "login"
      ? `${apiBase}/api/auth/login`
      : `${apiBase}/api/auth/register`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        setMessage("Error: Invalid response from server.");
        setLoading(false);
        return;
      }
      if (res.ok && mode === "login" && data.token) {
        // Store token in sessionStorage (not localStorage)
        sessionStorage.setItem("token", data.token);
        // Fetch user info to get role
        let userInfo: { role?: string } = {};
        try {
          const apiBase = process.env.REACT_APP_API_URL || "http://localhost:5000";
          const resUser = await fetch(`${apiBase}/api/auth/me`, {
            headers: { Authorization: `Bearer ${data.token}` },
          });
          if (resUser.ok) {
            const userData = await resUser.json();
            userInfo.role = userData.role;
            if (userData.role) sessionStorage.setItem("role", userData.role);
          }
        } catch {}
        setMessage("Login successful!");
        if (onLoginSuccess) onLoginSuccess(userInfo);
      } else if (res.ok && mode === "register") {
        setMessage("Registration successful! You can now log in.");
        setMode("login");
        setPassword("");
      } else {
        // Handle validation errors array from backend
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          setMessage(data.errors[0].msg || "Error");
        } else {
          setMessage(data.error || "Error");
        }
      }
    } catch (err) {
      setMessage("Network error: Unable to reach server.");
    } finally {
      setLoading(false);
    }
  }, [mode, email, password]);
  
    const handleModeSwitch = useCallback(() => {
    setMode(mode === "login" ? "register" : "login");
    setMessage("");
  }, [mode]);

  return (
    <div className="modern-form modern-form-horizontal modern-form-contrast" style={{ maxWidth: 400, margin: "2em auto", padding: "2em", borderRadius: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <h2 className="form-title" style={{ textAlign: "center", marginBottom: "1em" }}>{mode === "login" ? "Login" : "Register"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row-horizontal">
          <label className="form-label form-label-bold" htmlFor="email-input">Email</label>
          <input
            id="email-input"
            type="email"
            className="form-input"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ fontSize: "1rem" }}
          />
        </div>
        <div className="form-row-horizontal">
          <label className="form-label form-label-bold" htmlFor="password-input">Password</label>
          <input
            id="password-input"
            type="password"
            className="form-input"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ fontSize: "1rem" }}
          />
        </div>
        <button
          type="submit"
          className="form-button"
          style={{ width: "100%", fontWeight: "bold", fontSize: "1rem", marginTop: "1em" }}
          disabled={loading}
        >
          {loading ? (mode === "login" ? "Logging in..." : "Registering...") : (mode === "login" ? "Login" : "Register")}
        </button>
      </form>
      <button
        onClick={handleModeSwitch}
        className="form-button"
        style={{ width: "100%", background: "#eee", color: "#333", fontWeight: "normal", fontSize: "0.95rem", marginTop: "0.75em", border: "1px solid #ccc" }}
        disabled={loading}
      >
        {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
      </button>
      <div style={{ textAlign: "center", marginTop: "1em", color: message.includes("success") ? "#27ae60" : "#e74c3c", fontWeight: "bold" }}>{message}</div>
    </div>
  );
};
export default AuthForm;
