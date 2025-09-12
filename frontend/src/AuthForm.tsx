import React, { useState } from "react";

type Mode = "login" | "register";

interface AuthFormProps {
  onLoginSuccess?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

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
      <button onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
      </button>
      <div>{message}</div>
    </div>
  );
};

export default AuthForm;