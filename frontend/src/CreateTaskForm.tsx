import React, { useState } from "react";


interface CreateTaskFormProps {
  onTaskCreated?: () => void;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onTaskCreated }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Pending");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to create a task.");
      return;
    }
    try {
  const apiBase = process.env.REACT_APP_API_URL || "";
  const res = await fetch(`${apiBase}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          category,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setSuccess("Task created successfully!");
      setTitle("");
      setCategory("");
      setStatus("Pending");
      if (onTaskCreated) onTaskCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2em" }}>
      <h3>Create New Task</h3>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={e => setCategory(e.target.value)}
        required
      />
      <label htmlFor="status-select" style={{ marginRight: "1em" }}>
        <strong>Status:</strong>
        <select id="status-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="Pending">Pending</option>
          <option value="In-Progress">In-Progress</option>
          <option value="Done">Done</option>
        </select>
      </label>
      <button type="submit">Create Task</button>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {success && <div style={{ color: "green" }}>{success}</div>}
    </form>
  );
};

export default CreateTaskForm;