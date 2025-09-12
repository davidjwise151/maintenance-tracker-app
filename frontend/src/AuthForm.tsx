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

  console.log("Build-time API URL:", process.env.REACT_APP_API_URL);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    console.log("API URL:", process.env.REACT_APP_API_URL);
  const endpoint = `https://maintenance-tracker-app.onrender.com/api/auth/${mode}`;
    console.log("Endpoint:", endpoint);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let data;
      if (res.ok) {
        data = await res.json();
      } else {
        // Try to parse error, or fallback to status text
        try {
          data = await res.json();
        } catch {
          data = { error: res.statusText || `HTTP ${res.status}` };
        }
      }
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
    } catch (err) {
      setMessage("Network error");
    }
  };

  return (
    <div style={{ border: '2px solid #ff0000', padding: '16px', borderRadius: '8px' }}>
      <h2 style={{ color: '#ff0000' }}>Cloud Preview: {mode === "login" ? "Login" : "Register"}</h2>
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
        <button type="submit" style={{ backgroundColor: '#ff0000', color: '#fff' }}>
          {mode === "login" ? "Login to Cloud" : "Register to Cloud"}
        </button>
      </form>
      <button onClick={() => setMode(mode === "login" ? "register" : "login")}
        style={{ marginTop: '8px', backgroundColor: '#fff', color: '#ff0000', border: '1px solid #ff0000' }}>
        {mode === "login" ? "Need an account? Register (Cloud)" : "Already have an account? Login (Cloud)"}
      </button>
      <div style={{ marginTop: '12px', color: '#ff0000' }}>{message}</div>
      <div style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
        <strong>Preview Deployment UI Change</strong>
      </div>
    </div>
  );
};

export default AuthForm;