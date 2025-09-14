
import React, { useState, useEffect, useContext } from "react";
import { formatDateMMDDYYYY, parseDateInput } from "./utils/dateUtils";
import DatePicker from "react-datepicker";
import "./styles/datepicker.css";
import "./styles/modern-form.css";
import "react-datepicker/dist/react-datepicker.css";
import CreateTaskForm from "./CreateTaskForm";
import { ToastManagerContext } from "./ToastManager";


/**
 * MaintenanceTaskLog component displays a log/history view of all maintenance tasks.
 * - Allows filtering by category, status, date range, and pagination.
 * - Supports task creation, status updates, and deletion.
 * - Shows feedback via toast notifications.
 */
interface MaintenanceTaskLogProps {
  refreshReminders?: () => void;
}

const MaintenanceTaskLog: React.FC<MaintenanceTaskLogProps> = ({ refreshReminders }) => {
  // Helper functions for 5-year date limits
  function fiveYearsAgo() {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 5);
    d.setHours(0,0,0,0);
    return d;
  }
  function todayEnd() {
    const d = new Date();
    d.setHours(23,59,59,999);
    return d;
  }
  function fiveYearsFromNow() {
    // For due dates only
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    d.setHours(23,59,59,999);
    return d;
  }
  /**
   * Handles task deletion with confirmation and feedback.
   * Calls backend API to delete and updates UI.
   */
  const toastManager = useContext(ToastManagerContext);
  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) return;
    const token = localStorage.getItem("token");
    const apiBase = process.env.REACT_APP_API_URL || "";
    try {
      const res = await fetch(`${apiBase}/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete task");
      toastManager?.showToast("Task deleted successfully!", "success");
      // Remove deleted task from UI
      setTasks(tasks.filter((t: any) => t.id !== taskId));
      setTotal(total > 0 ? total - 1 : 0);
    } catch (err) {
      toastManager?.showToast("Error deleting task: " + String(err), "error");
    }
  };

  // State for tasks and filter/search controls
  const [tasks, setTasks] = useState([]);
  const [category, setCategory] = useState(""); // Filter by category (blank means All)
  const [status, setStatus] = useState(""); // Filter by status (blank means All)
    const statusOptions = ["Pending", "Accepted", "In-Progress", "Done", "Overdue"];
  const [from, setFrom] = useState(""); // Filter by completed start date
  const [to, setTo] = useState(""); // Filter by completed end date
  const [dueFrom, setDueFrom] = useState(""); // Filter by due date start
  const [dueTo, setDueTo] = useState(""); // Filter by due date end
  // Maintenance categories for dropdown
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
  const [page, setPage] = useState(1); // Pagination: current page
  const [pageSize, setPageSize] = useState(25); // Pagination: page size (default 25)
  const [total, setTotal] = useState(0); // Total number of results
  const [searchTrigger, setSearchTrigger] = useState(0); // Used to trigger search on filter change
  /**
   * Fetch completed tasks from backend with filters and pagination.
   * Updates tasks and total count in state.
   */
  const refreshTasks = () => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (status) params.append("status", status);
    // Completed date filter: 'from' is start of day, 'to' is end of day (inclusive)
    if (from) {
      const fromDate = parseDateInput(from);
      if (fromDate) params.append("from", fromDate.getTime().toString());
    }
    if (to) {
      const toDate = parseDateInput(to);
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
        params.append("to", toDate.getTime().toString());
      }
    }
    // Due date filter: 'dueFrom' is start of day, 'dueTo' is end of day (inclusive)
    if (dueFrom) {
      const dueFromDate = parseDateInput(dueFrom);
      if (dueFromDate) params.append("dueFrom", dueFromDate.getTime().toString());
    }
    if (dueTo) {
      const dueToDate = parseDateInput(dueTo);
      if (dueToDate) {
        dueToDate.setHours(23, 59, 59, 999);
        params.append("dueTo", dueToDate.getTime().toString());
      }
    }
    params.append("page", String(page));
    params.append("pageSize", String(pageSize));

    const token = localStorage.getItem("token");
    const apiBase = process.env.REACT_APP_API_URL || "";
    fetch(`${apiBase}/api/tasks/completed?${params.toString()}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch completed tasks");
        return res.json();
      })
      .then(data => {
        setTasks(data.tasks || []);
        setTotal(data.total || 0);
      })
      .catch(err => {
        setTasks([]);
        setTotal(0);
        console.error(err);
      });
  };

  // Refresh tasks only after search is triggered or pagination changes
  useEffect(() => {
    refreshTasks();
    // Debug: log tasks after fetch
    // This will log the tasks array every time it changes
    // eslint-disable-next-line
  }, [page, pageSize, searchTrigger]);

  useEffect(() => {
    if (tasks.length > 0) {
      console.log('Fetched tasks:', tasks);
    }
  }, [tasks]);

  /**
   * Renders UI: filter form, results table, pagination, and toast notifications.
   */
  return (
    <div className="task-log-container task-log-contrast">
      {/* CreateTaskForm: triggers refresh on new task creation */}
  <CreateTaskForm onTaskCreated={() => { refreshTasks(); if (refreshReminders) refreshReminders(); }} />
      <h3 className="task-log-title">Maintenance Task Log</h3>
      {/* Results counter */}
      <div style={{ marginBottom: "0.5em", fontWeight: "bold", fontSize: "1.08em" }}>
        Showing {tasks.length} result{tasks.length !== 1 ? "s" : ""}
        {total > tasks.length ? ` (of ${total} total)` : ""}
      </div>
      {/* Filter/search form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          // Only validate logical range (from > to)
          const fromDate = from ? parseDateInput(from) : null;
          const toDate = to ? parseDateInput(to) : null;
          if (fromDate && toDate && fromDate > toDate) {
            toastManager?.showToast("'From' date cannot be after 'To' date.", "error");
            return;
          }
          const dueFromDate = dueFrom ? parseDateInput(dueFrom) : null;
          const dueToDate = dueTo ? parseDateInput(dueTo) : null;
          if (dueFromDate && dueToDate && dueFromDate > dueToDate) {
            toastManager?.showToast("'Due From' date cannot be after 'Due To' date.", "error");
            return;
          }
          setPage(1);
          setSearchTrigger(searchTrigger + 1);
        }}
        className="task-log-filters task-log-filters-horizontal"
      >
        <div className="task-log-row-horizontal">
          <label className="task-log-label task-log-label-bold">Category</label>
          <select className="task-log-select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="task-log-row-horizontal">
          <label className="task-log-label task-log-label-bold">Status</label>
          <select className="task-log-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All</option>
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
          </select>
        </div>
        <div className="task-log-row-horizontal">
          <label className="task-log-label task-log-label-bold">Completed From</label>
          <DatePicker
            selected={from ? parseDateInput(from) : null}
            onChange={(date: Date | null) => setFrom(date ? formatDateMMDDYYYY(date) : "")}
            dateFormat="MM/dd/yyyy"
            placeholderText="MM/DD/YYYY"
            isClearable
            className="task-log-input"
            minDate={fiveYearsAgo()}
            maxDate={to ? (parseDateInput(to) && parseDateInput(to)! < todayEnd() ? parseDateInput(to) || undefined : todayEnd()) : todayEnd()}
          />
        </div>
        <div className="task-log-row-horizontal">
          <label className="task-log-label task-log-label-bold">Completed To</label>
          <DatePicker
            selected={to ? parseDateInput(to) : null}
            onChange={(date: Date | null) => setTo(date ? formatDateMMDDYYYY(date) : "")}
            dateFormat="MM/dd/yyyy"
            placeholderText="MM/DD/YYYY"
            isClearable
            className="task-log-input"
            minDate={from ? (parseDateInput(from) && parseDateInput(from)! < todayEnd() ? parseDateInput(from) || undefined : fiveYearsAgo()) : fiveYearsAgo()}
            maxDate={todayEnd()}
          />
        </div>
        <div className="task-log-row-horizontal">
          <label className="task-log-label task-log-label-bold">Due Date From</label>
          <DatePicker
            selected={dueFrom ? parseDateInput(dueFrom) : null}
            onChange={(date: Date | null) => setDueFrom(date ? formatDateMMDDYYYY(date) : "")}
            dateFormat="MM/dd/yyyy"
            placeholderText="MM/DD/YYYY"
            isClearable
            className="task-log-input"
            minDate={fiveYearsAgo()}
            maxDate={dueTo ? parseDateInput(dueTo) || undefined : fiveYearsFromNow()}
          />
        </div>
        <div className="task-log-row-horizontal">
          <label className="task-log-label task-log-label-bold">Due Date To</label>
          <DatePicker
            selected={dueTo ? parseDateInput(dueTo) : null}
            onChange={(date: Date | null) => setDueTo(date ? formatDateMMDDYYYY(date) : "")}
            dateFormat="MM/dd/yyyy"
            placeholderText="MM/DD/YYYY"
            isClearable
            className="task-log-input"
            minDate={dueFrom ? parseDateInput(dueFrom) || undefined : fiveYearsAgo()}
            maxDate={fiveYearsFromNow()}
          />
        </div>
        <div className="task-log-row-horizontal" style={{ alignItems: "center", justifyContent: "center", gap: "1em", marginTop: "1em" }}>
          <button type="submit" className="task-log-button" style={{ minWidth: 160, height: 40 }}>Search</button>
          <button
            type="button"
            className="task-log-button"
            style={{ background: "#fff", color: "#1976d2", border: "1px solid #1976d2", minWidth: 160, height: 40 }}
            onClick={() => {
              setCategory("");
              setStatus("");
              setFrom("");
              setTo("");
              setDueFrom("");
              setDueTo("");
              setPage(1);
              setSearchTrigger(searchTrigger + 1);
            }}
          >
            Clear Filters
          </button>
          <div>
            <button
              type="button"
              className="task-log-button"
              style={{ background: "#1976d2", color: "#fff", border: "1px solid #1976d2", minWidth: 160, height: 40, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px", fontSize: "0.98em" }}
            >
              <span style={{ marginRight: 8, fontSize: "0.97em", fontWeight: 500 }}>Results per page:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                style={{ border: "none", background: "#1976d2", color: "#fff", fontWeight: "bold", fontSize: "0.97em", width: 54, height: 28, borderRadius: 4, textAlign: "center", padding: "0 2px", marginLeft: 2 }}
              >
                {[25, 50, 100, 150, 200].map(val => (
                  <option key={val} value={val} style={{ color: "#1976d2", background: "#fff", fontSize: "0.97em" }}>{val}</option>
                ))}
              </select>
            </button>
          </div>
        </div>
      </form>

      {/* Results table or no-results message */}
      {tasks.length === 0 ? (
        <div style={{
          margin: "2em 0",
          color: "#555",
          fontSize: "1.35em",
          fontWeight: 600,
          textAlign: "center",
          background: "#f6f6f8",
          borderRadius: 12,
          padding: "1.5em 1em",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)"
        }}>
          <span style={{ display: "block", marginBottom: "0.5em" }}>
            No tasks found.
          </span>
          <span style={{ fontWeight: 400, fontSize: "1em", color: "#888" }}>
            Tip: Please refine your search, adjust filters, or try a different date range.
          </span>
        </div>
      ) : (
        <div style={{ width: "100%", overflowX: "auto", maxHeight: "500px", overflowY: "auto", margin: "1em 0", borderRadius: "8px", border: "1px solid #ccc" }}>
          <table style={{ minWidth: 900, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>Title</th>
                <th style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>Category</th>
                <th style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>Due Date</th>
                <th style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>Completed Date</th>
                <th style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>Status</th>
                <th style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>Owner</th>
                <th style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>Assignee</th>
                <th style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task: any) => (
                <tr key={task.id}>
                  <td style={{ border: "1px solid #ccc", padding: "0.5em", wordBreak: "break-word" }}>{task.title}</td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5em", wordBreak: "break-word" }}>{task.category || "Uncategorized"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>
                    {(typeof task.dueDate === "number" && task.dueDate > 0)
                      ? formatDateMMDDYYYY(new Date(task.dueDate))
                      : <span style={{color: '#888'}}>No due date set</span>}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>
                    {task.completedAt
                      ? formatDateMMDDYYYY(task.completedAt)
                      : "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>{task.status}</td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5em", wordBreak: "break-word" }}>{task.user?.email || "N/A"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5em", wordBreak: "break-word" }}>{task.assignee?.email || "Unassigned"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>
                    {/* Assignment action: Only owner can assign if unassigned */}
                    {!task.assignee && (
                      <button
                        onClick={() => {
                          const assigneeEmail = prompt("Enter assignee email:");
                          if (!assigneeEmail) return;
                          // You'd fetch userId by email from backend in a real app
                          toastManager?.showToast("Assigning...");
                          // For demo, assume email is userId
                          const token = localStorage.getItem("token");
                          const apiBase = process.env.REACT_APP_API_URL || "";
                          fetch(`${apiBase}/api/tasks/${task.id}/assign`, {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              "Authorization": token ? `Bearer ${token}` : "",
                            },
                            body: JSON.stringify({ assigneeId: assigneeEmail })
                          })
                            .then(res => {
                              if (!res.ok) throw new Error("Failed to assign");
                              toastManager?.showToast("Task assigned!", "success");
                              setSearchTrigger(searchTrigger + 1);
                            })
                            .catch(err => {
                              toastManager?.showToast("Error assigning: " + String(err), "error");
                            });
                        }}
                        style={{ background: "#1976d2", color: "#fff", border: "none", padding: "0.4em 0.8em", borderRadius: 4, cursor: "pointer", marginRight: 8 }}
                        title="Assign Task"
                      >
                        Assign
                      </button>
                    )}
                    {/* Acceptance action: Only assignee can accept if Pending */}
                    {task.assignee && task.status === "Pending" && (
                      <button
                        onClick={() => {
                          const token = localStorage.getItem("token");
                          const apiBase = process.env.REACT_APP_API_URL || "";
                          fetch(`${apiBase}/api/tasks/${task.id}/accept`, {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              "Authorization": token ? `Bearer ${token}` : "",
                            },
                          })
                            .then(res => {
                              if (!res.ok) throw new Error("Failed to accept");
                              toastManager?.showToast("Task accepted!", "success");
                              setSearchTrigger(searchTrigger + 1);
                            })
                            .catch(err => {
                              toastManager?.showToast("Error accepting: " + String(err), "error");
                            });
                        }}
                        style={{ background: "#43a047", color: "#fff", border: "none", padding: "0.4em 0.8em", borderRadius: 4, cursor: "pointer", marginRight: 8 }}
                        title="Accept Task"
                      >
                        Accept
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(task.id)}
                      style={{ background: "#f44336", color: "#fff", border: "none", padding: "0.4em 0.8em", borderRadius: 4, cursor: "pointer" }}
                      title="Delete Task"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

  {/* Pagination controls */}
      <div className="task-log-pagination">
        <button className="task-log-button" onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
        <span className="task-log-pagination-info"> Page {page} of {Math.ceil(total / pageSize) || 1} </span>
        <button className="task-log-button" onClick={() => setPage(page + 1)} disabled={page * pageSize >= total}>Next</button>
      </div>
    </div>
  );
};

export default MaintenanceTaskLog;
