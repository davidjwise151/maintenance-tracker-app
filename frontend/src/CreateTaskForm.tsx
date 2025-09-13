
import React, { useState } from "react";


  /**
   * Optional callback to trigger when a new task is created.
   */
  /**
   * Props for CreateTaskForm component.
   * @property onTaskCreated Optional callback to trigger when a new task is created.
   */
  interface CreateTaskFormProps {
    onTaskCreated?: () => void;
  }

/**
 * CreateTaskForm component allows users to create a new maintenance task.
 * - Handles form submission and validation
 * - Calls backend API to create a task
 * - Shows feedback on success or error
 */
const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onTaskCreated }) => {
  // State for form fields and feedback
  const [title, setTitle] = useState("");
  // Use the same category options as MaintenanceTaskLog
  const categories = [
    "",
    "Plumbing",
    "Flooring",
    "Inspections",
    "Electrical",
    "HVAC",
    "Landscaping",
    "Painting",
    "Other"
  ];
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Pending");
  const [dueDate, setDueDate] = useState(""); // ISO date string
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /**
   * Handles form submission to create a new task.
   * Validates input and calls backend API.
   */
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
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setSuccess("Task created successfully!");
  setTitle("");
  setCategory("");
  setStatus("Pending");
  setDueDate("");
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
      {/* Due date input */}
      <label htmlFor="due-date-input" style={{ marginRight: "1em" }}>
        <strong>Due Date:</strong>
        <input
          id="due-date-input"
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />
      </label>
      {/* Category dropdown to match MaintenanceTaskLog */}
      <label htmlFor="category-select" style={{ marginRight: "1em" }}>
        <strong>Category:</strong>
        <select
          id="category-select"
          value={category}
          onChange={e => setCategory(e.target.value)}
          required
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat || "All"}</option>
          ))}
        </select>
      </label>
      {/* Status dropdown to match MaintenanceTaskLog */}
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