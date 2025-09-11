import React, { useState } from "react";

const CreateTaskForm: React.FC<{ userId: string }> = ({ userId }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Pending");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, status, userId }),
    });
    setTitle("");
    setCategory("");
    setStatus("Pending");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required />
      <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category" />
      <select value={status} onChange={e => setStatus(e.target.value)}>
        <option value="Pending">Pending</option>
        <option value="In-Progress">In-Progress</option>
        <option value="Done">Done</option>
      </select>
      <button type="submit">Create Task</button>
    </form>
  );
};

export default CreateTaskForm;