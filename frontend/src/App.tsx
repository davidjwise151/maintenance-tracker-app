import React, { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage("Error fetching message"));
  }, []);

  return (
    <div>
      <h1>Backend Message:</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;