import React, { useState } from "react";
import "./styles/modern-form.css";

type Mode = "login" | "register";
interface AuthFormProps {
  onLoginSuccess?: () => void;
}
/**
 * AuthForm component handles user login and registration.
 * - Displays a form for email and password input.
 * - Submits to backend API for authentication or registration.
 * - Shows success or error messages.
 * - Stores JWT token in localStorage on successful login.
 */
const AuthForm: React.FC<AuthFormProps> = ({ onLoginSuccess }) => {
  // Form mode: 'login' or 'register'
  const [mode, setMode] = useState<Mode>("login");
  // User input state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Message to display feedback to user
  const [message, setMessage] = useState("");

  /**
   * Handles form submission for login or registration.
   * Calls backend API and updates UI based on response.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
  const apiBase = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const endpoint = mode === "login"
      ? `${apiBase}/api/auth/login`
      : `${apiBase}/api/auth/register`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok && mode === "login" && data.token) {
      localStorage.setItem("token", data.token);
      setMessage("Login successful!");
      if (onLoginSuccess) onLoginSuccess();
    } else if (res.ok && mode === "register") {
      setMessage("Registration successful! You can now log in.");
      setMode("login");
    } else {
      setMessage(data.error || "Error");
    }
  };

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
        <button type="submit" className="form-button" style={{ width: "100%", fontWeight: "bold", fontSize: "1rem", marginTop: "1em" }}>
          {mode === "login" ? "Login" : "Register"}
        </button>
      </form>
      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="form-button"
        style={{ width: "100%", background: "#eee", color: "#333", fontWeight: "normal", fontSize: "0.95rem", marginTop: "0.75em", border: "1px solid #ccc" }}
      >
        {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
      </button>
      <div style={{ textAlign: "center", marginTop: "1em", color: message.includes("success") ? "#27ae60" : "#e74c3c", fontWeight: "bold" }}>{message}</div>
    </div>
  );
};

export default AuthForm;
