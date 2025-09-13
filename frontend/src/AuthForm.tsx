import React, { useState } from "react";

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
    const apiBase = process.env.REACT_APP_API_URL || "";
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
    <div>
      <h2>{mode === "login" ? "Login" : "Register"}</h2>
      {/* Email and password form */}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        /><br />
        <button type="submit">{mode === "login" ? "Login" : "Register"}</button>
      </form>
      {/* Toggle between login and registration modes */}
      <button onClick={() => setMode(mode === "login" ? "register" : "login")}> 
        {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
      </button>
      {/* Feedback message */}
      <div>{message}</div>
    </div>
  );
};

export default AuthForm;
