import React, { useState } from "react";
import AuthForm from "./AuthForm";

function App() {
  const [protectedMsg, setProtectedMsg] = useState("");

  const fetchProtected = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setProtectedMsg(data.message || "Unauthorized");
  };

  return (
    <div>
      <AuthForm />
      <button onClick={fetchProtected}>Test Protected Route</button>
      <div>{protectedMsg}</div>
    </div>
  );
}

export default App;