
import React, { useState, useEffect, useContext } from "react";
import { formatDateMMDDYYYY, parseDateInput } from "./utils/dateUtils";
import DatePicker from "react-datepicker";
import "./styles/datepicker.css";
import "./styles/modern-form.css";
import "react-datepicker/dist/react-datepicker.css";
import { useTasks } from "./hooks/useTasks";
import CreateTaskForm from "./CreateTaskForm";
import { ToastManagerContext } from "./ToastManager";
import { useUsers } from "./hooks/useUsers";
import { apiFetch } from "./utils/apiFetch";

// Helper to check if current user is the assignee
function isCurrentUserAssignee(assignee: any) {
  // Assumes assignee has an id or email
  const userEmail = sessionStorage.getItem("userEmail");
  if (!userEmail) return false;
  return assignee?.email === userEmail;
}

// Dropdown for assigning a user to a task
type AssignDropdownProps = { taskId: string; onAssigned: () => void };
import { useTaskActions } from "./hooks/useTaskActions";
const AssignDropdown: React.FC<AssignDropdownProps> = ({ taskId, onAssigned }) => {
  const { users, loading: usersLoading, error: usersError } = useUsers();
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);
  const { assignTask } = useTaskActions();

  // Assign selected user to the task
  const handleAssign = () => {
    if (!selectedUser) return;
    setLoading(true);
    assignTask(taskId, selectedUser, () => {
      setLoading(false);
      onAssigned();
    });
  };

  return (
    <span>
      <select
        value={selectedUser}
        onChange={e => setSelectedUser(e.target.value)}
        style={{ minWidth: 160, marginRight: 8 }}
      >
        <option value="">Select assignee</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.email}</option>
        ))}
      </select>
      <button
        onClick={handleAssign}
        disabled={!selectedUser || loading}
        style={{ background: "#1976d2", color: "#fff", border: "none", padding: "0.4em 0.8em", borderRadius: 4, cursor: "pointer" }}
        title="Assign Task"
      >
        Assign
      </button>
    </span>
  );
};

/**
 * MaintenanceTaskLog component displays a log/history view of all maintenance tasks.
 * - Allows filtering by category, status, date range, and pagination.
 * - Supports task creation, status updates, and deletion.
 * - Shows feedback via toast notifications.
 */
interface MaintenanceTaskLogProps {
  refreshReminders?: () => void;
  userRole?: string;
}

const MaintenanceTaskLog: React.FC<MaintenanceTaskLogProps> = ({ refreshReminders, userRole }) => {
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
    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.status === 403) {
        toastManager?.showToast("You do not have permission to delete this task.", "error");
        return;
      }
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete task");
      toastManager?.showToast("Task deleted successfully!", "success");
      fetchTasks();
    } catch (err) {
      toastManager?.showToast("Error deleting task: " + String(err), "error");
    }
  };

  // Use useTasks for fetching, filtering, and paginating tasks
  const {
    tasks,
    total,
    error,
    loading,
    filters,
    setFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    fetchTasks,
  } = useTasks();

  // Helper setters for filter fields
  const setCategory = (category: string) => setFilters({ ...filters, category });
  const setStatus = (status: string) => setFilters({ ...filters, status });
  const setFrom = (from: string) => setFilters({ ...filters, from });
  const setTo = (to: string) => setFilters({ ...filters, to });
  const setDueFrom = (dueFrom: string) => setFilters({ ...filters, dueFrom });
  const setDueTo = (dueTo: string) => setFilters({ ...filters, dueTo });

  // Remove unused local state for filters
  // (category, status, from, to, dueFrom, dueTo, setSearchTrigger, searchTrigger)

  const statusOptions = ["Pending", "Accepted", "In-Progress", "Done"];
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

  /**
   * Renders UI: filter form, results table, pagination, and toast notifications.
   */
  if (error) {
    return (
      <div className="task-log-container task-log-contrast">
        <div style={{ margin: "2em auto", padding: "2em", background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: 600 }}>
          <h2 style={{ color: "#c0392b", textAlign: "center" }}>Error</h2>
          <div style={{ textAlign: "center", color: "#888", fontSize: "1.08rem", marginBottom: "1.2em" }}>{error}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="task-log-container task-log-contrast">
      {/* CreateTaskForm: triggers refresh on new task creation */}
  <CreateTaskForm onTaskCreated={() => { fetchTasks(); if (refreshReminders) refreshReminders(); }} userRole={userRole} />
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
          const fromDate = filters.from ? parseDateInput(filters.from) : null;
          const toDate = filters.to ? parseDateInput(filters.to) : null;
          if (fromDate && toDate && fromDate > toDate) {
            toastManager?.showToast("'From' date cannot be after 'To' date.", "error");
            return;
          }
          const dueFromDate = filters.dueFrom ? parseDateInput(filters.dueFrom) : null;
          const dueToDate = filters.dueTo ? parseDateInput(filters.dueTo) : null;
          if (dueFromDate && dueToDate && dueFromDate > dueToDate) {
            toastManager?.showToast("'Due From' date cannot be after 'Due To' date.", "error");
            return;
          }
          setPage(1);
          fetchTasks();
        }}
        className="task-log-filters task-log-filters-horizontal"
      >
        <div className="task-log-row-horizontal">
          <label className="task-log-label task-log-label-bold">Category</label>
          <select className="task-log-select" value={filters.category || ""} onChange={e => setCategory(e.target.value)}>
            <option value="">All</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="task-log-row-horizontal">
          <label className="task-log-label task-log-label-bold">Status</label>
          <select className="task-log-select" value={filters.status || ""} onChange={e => setStatus(e.target.value)}>
            <option value="">All</option>
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
          </select>
        </div>
        <div className="task-log-row-horizontal">
          <label className="task-log-label task-log-label-bold">Completed From</label>
          <DatePicker
            selected={filters.from ? parseDateInput(filters.from) : null}
            onChange={(date: Date | null) => setFrom(date ? formatDateMMDDYYYY(date) : "")}
            dateFormat="MM/dd/yyyy"
            placeholderText="MM/DD/YYYY"
            isClearable
            className="task-log-input"
            minDate={fiveYearsAgo()}
            maxDate={filters.to ? (parseDateInput(filters.to) && parseDateInput(filters.to)! < todayEnd() ? parseDateInput(filters.to) || undefined : todayEnd()) : todayEnd()}
          />
        </div>
        <div className="task-log-row-horizontal">
          <label className="task-log-label task-log-label-bold">Completed To</label>
          <DatePicker
            selected={filters.to ? parseDateInput(filters.to) : null}
            onChange={(date: Date | null) => setTo(date ? formatDateMMDDYYYY(date) : "")}
            dateFormat="MM/dd/yyyy"
            placeholderText="MM/DD/YYYY"
            isClearable
            className="task-log-input"
            minDate={filters.from ? (parseDateInput(filters.from) && parseDateInput(filters.from)! < todayEnd() ? parseDateInput(filters.from) || undefined : fiveYearsAgo()) : fiveYearsAgo()}
            maxDate={todayEnd()}
          />
        </div>
        <div className="task-log-row-horizontal">
          <label className="task-log-label task-log-label-bold">Due Date From</label>
          <DatePicker
            selected={filters.dueFrom ? parseDateInput(filters.dueFrom) : null}
            onChange={(date: Date | null) => setDueFrom(date ? formatDateMMDDYYYY(date) : "")}
            dateFormat="MM/dd/yyyy"
            placeholderText="MM/DD/YYYY"
            isClearable
            className="task-log-input"
            minDate={fiveYearsAgo()}
            maxDate={filters.dueTo ? parseDateInput(filters.dueTo) || undefined : fiveYearsFromNow()}
          />
        </div>
        <div className="task-log-row-horizontal">
          <label className="task-log-label task-log-label-bold">Due Date To</label>
          <DatePicker
            selected={filters.dueTo ? parseDateInput(filters.dueTo) : null}
            onChange={(date: Date | null) => setDueTo(date ? formatDateMMDDYYYY(date) : "")}
            dateFormat="MM/dd/yyyy"
            placeholderText="MM/DD/YYYY"
            isClearable
            className="task-log-input"
            minDate={filters.dueFrom ? parseDateInput(filters.dueFrom) || undefined : fiveYearsAgo()}
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
              setFilters({});
              setPage(1);
              fetchTasks();
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
                  <td style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>
                    {task.status}
                    {task.isOverdue && task.status !== "Done" && (
                      <span style={{ color: "#d32f2f", fontWeight: 600, marginLeft: 8 }} title="Overdue">(Overdue)</span>
                    )}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5em", wordBreak: "break-word" }}>{task.user?.email || "N/A"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5em", wordBreak: "break-word" }}>{task.assignee?.email || "Unassigned"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>
          {/* Assignment action: Only admin can assign if unassigned */}
          {userRole === "admin" && !task.assignee && (
            // TODO: Refactor AssignDropdown onAssigned to use fetchTasks or similar if needed
            <AssignDropdown taskId={task.id} onAssigned={fetchTasks} />
          )}
                    {/* Acceptance action: Button always visible if task.assignee and status Pending, but only enabled for assignee */}
                    {task.assignee && task.status === "Pending" && (
                      <button
                        onClick={() => {
                          if (!isCurrentUserAssignee(task.assignee)) return;
                          const token = sessionStorage.getItem("token");
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
                              fetchTasks();
                            })
                            .catch(err => {
                              toastManager?.showToast("Error accepting: " + String(err), "error");
                            });
                        }}
                        disabled={!isCurrentUserAssignee(task.assignee)}
                        style={{
                          background: isCurrentUserAssignee(task.assignee) ? "#43a047" : "#bdbdbd",
                          color: "#fff",
                          border: "none",
                          padding: "0.4em 0.8em",
                          borderRadius: 4,
                          cursor: isCurrentUserAssignee(task.assignee) ? "pointer" : "not-allowed",
                          marginRight: 8,
                          opacity: isCurrentUserAssignee(task.assignee) ? 1 : 0.6
                        }}
                        title={isCurrentUserAssignee(task.assignee) ? "Accept Task" : "Only the assignee can accept"}
                      >
                        Accept
                      </button>
                    )}
                    {/* Only admin can delete any task */}
                    {userRole === "admin" && (
                      <button
                        onClick={() => handleDelete(task.id)}
                        style={{ background: "#f44336", color: "#fff", border: "none", padding: "0.4em 0.8em", borderRadius: 4, cursor: "pointer" }}
                        title="Delete Task"
                      >
                        Delete
                      </button>
                    )}
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
