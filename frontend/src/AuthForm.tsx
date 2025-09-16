import React, { useState, useCallback, useRef, useEffect } from "react";
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
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Handles form submission for login or registration
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage("");
      const { email, password } = form;
      // Debug log for form values and mode
      console.log("AuthForm submit", { mode, email, password });
      // Basic client-side validation
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        console.log("Email failed regex validation", email);
        setMessage("Please enter a valid email address.");
        setTimeout(() => {
          emailInputRef.current?.focus();
        }, 0);
        return;
      }
      if (password.length < 6) {
        console.log("Password too short", password);
        setMessage("Password must be at least 6 characters.");
        setTimeout(() => {
          emailInputRef.current?.focus();
        }, 0);
        return;
      }
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const endpoint =
        mode === "login"
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
          sessionStorage.setItem("token", data.token);
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
              if (userData.email) sessionStorage.setItem("userEmail", userData.email);
            }
          } catch {}
          setMessage("Login successful!");
          if (onLoginSuccess) onLoginSuccess(userInfo);
        } else if (res.ok && mode === "register") {
          setMessage("Registration successful! You can now log in.");
          setMode("login");
          setForm({ email: "", password: "" });
        } else {
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
    },
    [mode, form, onLoginSuccess]
  );

  // No longer needed: field clearing is now synchronous with mode switch after registration

  const handleModeSwitch = useCallback(() => {
    setMode((prev) => {
      const next = prev === "login" ? "register" : "login";
      setForm({ email: "", password: "" });
      setMessage("");
      return next;
    });
  }, []);

  return (
    <div
      className="modern-form modern-form-horizontal modern-form-contrast"
      style={{
        maxWidth: 400,
        margin: "2em auto",
        padding: "2em",
        borderRadius: 8,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      <h2 className="form-title" style={{ textAlign: "center", marginBottom: "1em" }}>
        {mode === "login" ? "Login" : "Register"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row-horizontal">
          <label className="form-label form-label-bold" htmlFor="email-input">
            Email
          </label>
          <input
            id="email-input"
            type="email"
            className="form-input"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            style={{ fontSize: "1rem" }}
            ref={emailInputRef}
          />
        </div>
        <div className="form-row-horizontal">
          <label className="form-label form-label-bold" htmlFor="password-input">
            Password
          </label>
          <input
            id="password-input"
            type="password"
            className="form-input"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            style={{ fontSize: "1rem" }}
          />
        </div>
        <button
          type="submit"
          className="form-button"
          style={{
            width: "100%",
            fontWeight: "bold",
            fontSize: "1rem",
            marginTop: "1em",
          }}
          disabled={loading}
        >
          {loading
            ? mode === "login"
              ? "Logging in..."
              : "Registering..."
            : mode === "login"
            ? "Login"
            : "Register"}
        </button>
      </form>
      <button
        onClick={handleModeSwitch}
        className="form-button"
        style={{
          width: "100%",
          background: "#eee",
          color: "#333",
          fontWeight: "normal",
          fontSize: "0.95rem",
          marginTop: "0.75em",
          border: "1px solid #ccc",
        }}
        disabled={loading}
      >
        {mode === "login"
          ? "Need an account? Register"
          : "Already have an account? Login"}
      </button>
      <div
        style={{
          textAlign: "center",
          marginTop: "1em",
          color: message.includes("success") ? "#27ae60" : "#e74c3c",
          fontWeight: "bold",
        }}
      >
        {message}
      </div>
    </div>
  );
};
export default AuthForm;