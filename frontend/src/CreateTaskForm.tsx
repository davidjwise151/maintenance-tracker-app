import "./styles/modern-form.css";

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatDateMMDDYYYY, parseDateInput } from "./utils/dateUtils";


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
  // Due date input uses yyyy-mm-dd from <input type="date">, displayed as MM/DD/YYYY in UI
  const [dueDate, setDueDate] = useState("");
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
      // Always send dueDate, even if blank
      let dueDateValue = dueDate ? new Date(dueDate).getTime() : null;
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
          dueDate: dueDateValue,
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
  <form onSubmit={handleSubmit} className="modern-form modern-form-horizontal modern-form-contrast">
    <h3 className="form-title">Create New Task</h3>
    <div className="form-row-horizontal">
      <label htmlFor="title-input" className="form-label form-label-bold">Title</label>
      <input
        id="title-input"
        type="text"
        className="form-input"
        placeholder="Task Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
    </div>
    <div className="form-row-horizontal">
      <label htmlFor="due-date-input" className="form-label form-label-bold">Due Date</label>
      <DatePicker
        id="due-date-input"
        selected={dueDate ? parseDateInput(dueDate) : null}
        onChange={(date: Date | null) => setDueDate(date ? formatDateMMDDYYYY(date) : "")}
        dateFormat="MM/dd/yyyy"
        placeholderText="MM/DD/YYYY"
        isClearable
        className="datepicker-input"
      />
    </div>
    <div className="form-row-horizontal">
      <label htmlFor="category-select" className="form-label form-label-bold">Category</label>
      <select
        id="category-select"
        className="form-input"
        value={category}
        onChange={e => setCategory(e.target.value)}
      >
        <option value="">Select Category</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>
    <div className="form-row-horizontal">
      <label htmlFor="status-select" className="form-label form-label-bold">Status</label>
      <select
        id="status-select"
        className="form-input"
        value={status}
        onChange={e => setStatus(e.target.value)}
      >
        <option value="Pending">Pending</option>
        <option value="In-Progress">In-Progress</option>
        <option value="Done">Done</option>
      </select>
    </div>
    <button type="submit" className="form-button">Create Task</button>
    {error && <div className="form-error">{error}</div>}
    {success && <div className="form-success">{success}</div>}
  </form>
  );
};

export default CreateTaskForm;
