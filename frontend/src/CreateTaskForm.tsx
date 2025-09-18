import "./styles/modern-form.css";

import React, { useState, useEffect, useContext } from "react";
import { validateTaskForm } from "./validateTaskForm";
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
    userRole?: string;
  }

/**
 * CreateTaskForm component allows users to create a new maintenance task.
 * - Handles form submission and validation
 * - Calls backend API to create a task
 * - Shows feedback on success or error
 */
const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onTaskCreated, userRole }) => {
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
  // Assignee selection
  const [users, setUsers] = useState<Array<{ id: string; email: string }>>([]);
  const [assigneeId, setAssigneeId] = useState("");
  // Fetch users for assignee dropdown (all roles)
  useEffect(() => {
    const apiBase = process.env.REACT_APP_API_URL || "";
    const token = sessionStorage.getItem("token");
    if (!token) return;
    fetch(`${apiBase}/api/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.resolve({ users: [] }))
      .then(data => setUsers(data.users || []));
  }, [userRole]);

  const [error, setError] = useState("");
  // Holds info about a detected duplicate task, if any
  const [duplicateTaskInfo, setDuplicateTaskInfo] = useState<any | null>(null);
  const toastManager = useContext(ToastManagerContext);

  /**
   * Handles form submission to create a new task.
   * Validates input and calls backend API.
   */
  // Used to store the last form submission event for retry after confirmation
  const [pendingSubmission, setPendingSubmission] = useState<React.FormEvent | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Centralized validation
    const validationError = validateTaskForm({ title, status, dueDate });
    if (validationError) {
      setError(validationError);
      // Show toast for date-related errors
      if (validationError.toLowerCase().includes("due date")) {
        if (validationError.includes("past")) {
          toastManager?.showToast("Pick a valid due date (today or later).", "error");
        } else if (validationError.includes("5 years")) {
          toastManager?.showToast("Pick a due date within 5 years from today.", "error");
        } else if (validationError.includes("Done")) {
          toastManager?.showToast("Tasks marked as Done should not have a due date.", "error");
        }
      }
      return;
    }
    const token = sessionStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to create a task.");
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
    let duplicateTaskInfo: any = null;
    try {
      const apiBase = process.env.REACT_APP_API_URL || "";
      const token = sessionStorage.getItem("token");
      const resDup = await fetch(`${apiBase}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataDup = await resDup.json();
      if (Array.isArray(dataDup.tasks)) {
        const found = dataDup.tasks.find((t: any) => t.title === title && String(t.dueDate || "") === String(dueDateValue || ""));
        if (found) {
          duplicateTaskInfo = found;
        }
      }
    } catch {}
    if (duplicateTaskInfo) {
      // If duplicateTaskInfo is set, this is a retry after confirmation, so proceed
      // Otherwise, set duplicate info and pause for confirmation
      if (!pendingSubmission) {
        setDuplicateTaskInfo(duplicateTaskInfo);
        setPendingSubmission(e);
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
          assigneeId: assigneeId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      toastManager?.showToast("Task created successfully!", "success");
  setTitle("");
  setCategory("");
  setStatus("Pending");
  setDueDate("");
  setAssigneeId("");
      if (onTaskCreated) onTaskCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toastManager?.showToast(err instanceof Error ? err.message : "An unknown error occurred", "error");
    }
  };

  // Handler for confirming duplicate creation
  const handleConfirmDuplicate = async () => {
    setDuplicateTaskInfo(null);
    // Retry submission, but skip duplicate check
    if (pendingSubmission) {
      setPendingSubmission(null);
      // Call handleSubmit again, but with duplicateTaskInfo cleared
      await handleSubmit(new Event('submit') as unknown as React.FormEvent);
    }
  };

  // Handler for cancelling duplicate creation
  const handleCancelDuplicate = () => {
    setDuplicateTaskInfo(null);
    setPendingSubmission(null);
    setError('Task creation cancelled due to duplicate.');
    toastManager?.showToast('Task creation cancelled due to duplicate.', 'error');
  };

  return (
  <div style={{
    margin: "2em 0",
    padding: "2em",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    maxWidth: 600,
    marginLeft: "auto",
    marginRight: "auto"
  }}>
    {/* Duplicate confirmation modal */}
    {duplicateTaskInfo && (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.25)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', minWidth: 320, maxWidth: 400 }}>
          <h2 style={{ color: '#b00020', marginTop: 0 }}>Possible Duplicate Task</h2>
          <div style={{ color: '#444', marginBottom: 16 }}>
            A task with the same title and due date already exists.<br />
            <b>Title:</b> {duplicateTaskInfo.title}<br />
            <b>Due Date:</b> {duplicateTaskInfo.dueDate ? new Date(duplicateTaskInfo.dueDate).toLocaleDateString() : 'N/A'}<br />
            {duplicateTaskInfo.assigneeId && <><b>Assignee:</b> {duplicateTaskInfo.assigneeId}<br /></>}
            <b>Status:</b> {duplicateTaskInfo.status}
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
            <button onClick={handleCancelDuplicate} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 6, padding: '0.5em 1.2em', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleConfirmDuplicate} style={{ background: '#2980b9', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5em 1.2em', fontWeight: 600, cursor: 'pointer' }}>Create Anyway</button>
          </div>
        </div>
      </div>
    )}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.2em" }}>
      <svg width="36" height="36" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 12 }}>
        <circle cx="22" cy="22" r="20" fill="#2980b9" />
        <path d="M14 28c0-6 8-6 8-12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="22" cy="16" r="2.5" fill="#fff" />
      </svg>
      <h2 style={{
        fontFamily: 'SF Pro Display, Helvetica Neue, Arial, sans-serif',
        fontWeight: 700,
        fontSize: '2rem',
        color: '#222',
        letterSpacing: '-0.02em',
        textAlign: 'center',
        textShadow: '0 2px 8px rgba(0,0,0,0.08)',
        margin: 0
      }}>Create New Task</h2>
    </div>
    <div style={{ textAlign: "center", color: "#888", fontSize: "1.08rem", marginBottom: "1.2em" }}>
      <span>
        Create a new maintenance task and set deadlines. <br />
      </span>
    </div>
    {error && (
      <div role="alert" style={{ color: '#b00020', marginBottom: '1em', fontWeight: 600, fontSize: '1.08rem' }}>
        {error}
      </div>
    )}
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <div style={{ marginBottom: "1.2em" }}>
        <label htmlFor="title-input" style={{ fontWeight: 600, color: "#222", fontSize: "1.08rem", marginBottom: 4, display: "block" }}>Title</label>
        <input
          id="title-input"
          type="text"
          style={{ fontSize: "1.08rem", padding: "0.6em 1em", borderRadius: 8, border: "1px solid #e0e0e0", width: "100%", background: "#f5f5f7" }}
          placeholder="Task Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: "1.2em" }}>
        <label htmlFor="due-date-input" style={{ fontWeight: 600, color: "#222", fontSize: "1.08rem", marginBottom: 4, display: "block" }}>Due Date</label>
        <div style={{ width: "100%" }}>
          <DatePicker
            id="due-date-input"
            selected={dueDate ? parseDateInput(dueDate) : null}
            onChange={(date: Date | null) => setDueDate(date ? formatDateMMDDYYYY(date) : "")}
            dateFormat="MM/dd/yyyy"
            placeholderText="MM/DD/YYYY"
            isClearable
            className="custom-datepicker-input"
            minDate={new Date()}
          />
        </div>
      </div>
      <div style={{ marginBottom: "1.2em" }}>
        <label htmlFor="category-select" style={{ fontWeight: 600, color: "#222", fontSize: "1.08rem", marginBottom: 4, display: "block" }}>Category</label>
        <select
          id="category-select"
          style={{ fontSize: "1.08rem", padding: "0.6em 1em", borderRadius: 8, border: "1px solid #e0e0e0", width: "100%", background: "#f5f5f7" }}
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: "1.2em" }}>
        <label htmlFor="status-select" style={{ fontWeight: 600, color: "#222", fontSize: "1.08rem", marginBottom: 4, display: "block" }}>Status</label>
        <select
          id="status-select"
          style={{ fontSize: "1.08rem", padding: "0.6em 1em", borderRadius: 8, border: "1px solid #e0e0e0", width: "100%", background: "#f5f5f7" }}
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="">Select Status</option>
          <option value="Pending">Pending</option>
          <option value="In-Progress">In-Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>
      <div style={{ marginBottom: "1.2em" }}>
        <label htmlFor="assignee-select" style={{ fontWeight: 600, color: "#222", fontSize: "1.08rem", marginBottom: 4, display: "block" }}>Assignee (optional)</label>
        <select
          id="assignee-select"
          style={{ fontSize: "1.08rem", padding: "0.6em 1em", borderRadius: 8, border: "1px solid #e0e0e0", width: "100%", background: "#f5f5f7" }}
          value={assigneeId}
          onChange={e => setAssigneeId(e.target.value)}
        >
          <option value="">Select Assignee</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.email}</option>
          ))}
        </select>
      </div>
      <button type="submit" style={{
        background: "#2980b9",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "0.7em 2em",
        fontWeight: 700,
        fontSize: "1.08rem",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(41,128,185,0.08)",
        marginTop: "0.5em"
      }}>
        <span style={{ marginRight: 6, fontSize: "1.2em" }}>➕</span>Create Task
      </button>
    </form>
  </div>
  );
};

export default CreateTaskForm;
