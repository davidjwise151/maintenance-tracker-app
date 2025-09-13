import "./styles/modern-form.css";

import React, { useState, useContext } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatDateMMDDYYYY, parseDateInput } from "./utils/dateUtils";
import { ToastManagerContext } from "./ToastManager";


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
  const [status, setStatus] = useState("");
  // Due date input uses yyyy-mm-dd from <input type="date">, displayed as MM/DD/YYYY in UI
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const toastManager = useContext(ToastManagerContext);

  /**
   * Handles form submission to create a new task.
   * Validates input and calls backend API.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to create a task.");
      return;
    }
    // Prevent due date in the past
    if (!status) {
      toastManager?.showToast("Please select a status.", "error");
      return;
    }
    if (dueDate) {
      const selectedDate = parseDateInput(dueDate);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (selectedDate && selectedDate < today) {
        setError("Due date cannot be in the past.");
        toastManager?.showToast("Pick a valid due date (today or later).", "error");
        return;
      }
      // Prevent due date more than 5 years in the future
      const fiveYearsFromNow = new Date();
      fiveYearsFromNow.setFullYear(today.getFullYear() + 5);
      if (selectedDate && selectedDate > fiveYearsFromNow) {
        setError("Due date cannot be more than 5 years from today.");
        toastManager?.showToast("Pick a due date within 5 years from today.", "error");
        return;
      }
    }
    // If status is Done, due date should be blank
    if (status === "Done" && dueDate) {
      setError("No due date should be set for a task marked as Done.");
      toastManager?.showToast("Tasks marked as Done should not have a due date.", "error");
      return;
    }
    // Normalize dueDate to local timezone midnight
  let dueDateValue: number | null = null;
    if (dueDate) {
      const d = parseDateInput(dueDate);
      if (d) {
        d.setHours(0,0,0,0);
        dueDateValue = d.getTime();
      }
    }
    // Duplicate task detection (title + dueDate)
    // Fetch existing tasks and check for duplicates
    let isDuplicate = false;
    try {
      const apiBase = process.env.REACT_APP_API_URL || "";
      const token = localStorage.getItem("token");
      const resDup = await fetch(`${apiBase}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataDup = await resDup.json();
      if (Array.isArray(dataDup.tasks)) {
        isDuplicate = dataDup.tasks.some((t: any) => t.title === title && String(t.dueDate || "") === String(dueDateValue || ""));
      }
    } catch {}
    if (isDuplicate) {
      if (!window.confirm("A task with this title and due date already exists. Do you want to create a duplicate?")) {
        setError("Task creation cancelled due to duplicate.");
        toastManager?.showToast("Task creation cancelled due to duplicate.", "error");
        return;
      }
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
          dueDate: dueDateValue,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      toastManager?.showToast("Task created successfully!", "success");
      setTitle("");
      setCategory("");
      setStatus("Pending");
      setDueDate("");
      if (onTaskCreated) onTaskCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toastManager?.showToast(err instanceof Error ? err.message : "An unknown error occurred", "error");
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
        minDate={new Date()}
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
        required
      >
        <option value="">Select Status</option>
        <option value="Pending">Pending</option>
        <option value="In-Progress">In-Progress</option>
        <option value="Done">Done</option>
      </select>
    </div>
    <button type="submit" className="form-button">Create Task</button>
  </form>
  );
};

export default CreateTaskForm;
