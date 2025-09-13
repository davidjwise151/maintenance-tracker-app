
import React, { useState, useEffect } from "react";
import CreateTaskForm from "./CreateTaskForm";
import Toast from "./Toast";


// Helper function for DD/MM/YYYY formatting
// Helper function for DD/MM/YYYY formatting
function formatDateDDMMYYYY(date: number | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear().toString();
  return dd + '/' + mm + '/' + yyyy;
}

/**
 * MaintenanceTaskLog component displays a log/history view of all maintenance tasks.
 * - Allows filtering by category, status, date range, and pagination.
 * - Supports task creation, status updates, and deletion.
 * - Shows feedback via toast notifications.
 */
const MaintenanceTaskLog: React.FC = () => {
  /**
   * Handles task deletion with confirmation and feedback.
   * Calls backend API to delete and updates UI.
   */
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
      setToast({ message: "Task deleted successfully!", type: "success" });
      // Remove deleted task from UI
      setTasks(tasks.filter((t: any) => t.id !== taskId));
      setTotal(total > 0 ? total - 1 : 0);
    } catch (err) {
      setToast({ message: "Error deleting task: " + String(err), type: "error" });
    }
  };

  // State for tasks and filter/search controls
  const [tasks, setTasks] = useState([]);
  const [category, setCategory] = useState(""); // Filter by category (blank means All)
  const [status, setStatus] = useState(""); // Filter by status (blank means All)
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
  const [pageSize, setPageSize] = useState(5); // Pagination: page size
  const [total, setTotal] = useState(0); // Total number of results
  const [searchTrigger, setSearchTrigger] = useState(0); // Used to trigger search on filter change
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  /**
   * Fetch completed tasks from backend with filters and pagination.
   * Updates tasks and total count in state.
   */
  const refreshTasks = () => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (status) params.append("status", status);
    // Completed date filter: 'from' is start, 'to' is inclusive end of selected day
    // Helper to parse MM/DD/YYYY string to Date
    // Date input fields return yyyy-mm-dd, so parse accordingly
    function parseDateInput(str: string, endOfDay = false): Date | null {
      if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
      const [yyyy, mm, dd] = str.split('-').map(Number);
      const d = new Date(yyyy, mm - 1, dd);
      if (endOfDay) d.setHours(23, 59, 59, 999); else d.setHours(0, 0, 0, 0);
      return d;
    }
    // Completed date filter: 'from' is start of day, 'to' is end of day (inclusive)
    if (from) {
      const fromDate = parseDateInput(from);
      if (fromDate) params.append("from", fromDate.getTime().toString());
    }
    if (to) {
      const toDate = parseDateInput(to, true);
      if (toDate) params.append("to", toDate.getTime().toString());
    }
    // Due date filter: 'dueFrom' is start of day, 'dueTo' is end of day (inclusive)
    if (dueFrom) {
      const dueFromDate = parseDateInput(dueFrom);
      if (dueFromDate) params.append("dueFrom", dueFromDate.getTime().toString());
    }
    if (dueTo) {
      const dueToDate = parseDateInput(dueTo, true);
      if (dueToDate) params.append("dueTo", dueToDate.getTime().toString());
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
    <div>
  {/* CreateTaskForm: triggers refresh on new task creation */}
      <CreateTaskForm onTaskCreated={refreshTasks} />
      <h2>Maintenance Task Log</h2>
  {/* Results counter */}
      <div style={{ marginBottom: "0.5em", fontWeight: "bold" }}>
        Showing {tasks.length} result{tasks.length !== 1 ? "s" : ""}
        {total > tasks.length ? ` (of ${total} total)` : ""}
      </div>
  {/* Filter/search form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          setPage(1);
          setSearchTrigger(searchTrigger + 1);
        }}
        style={{
          marginBottom: "1em",
          padding: "1em",
          border: "1px solid #ccc",
          borderRadius: "8px",
          background: "#f9f9f9",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.5em"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
          <label><strong>Category</strong>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
          <label><strong>Status</strong>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="In-Progress">In-Progress</option>
              <option value="Done">Done</option>
            </select>
          </label>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
          <label><strong>Completed From</strong>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </label>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
          <label><strong>Completed To</strong>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </label>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
          <label><strong>Due Date From</strong>
            <input type="date" value={dueFrom} onChange={e => setDueFrom(e.target.value)} />
          </label>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
          <label><strong>Due Date To</strong>
            <input type="date" value={dueTo} onChange={e => setDueTo(e.target.value)} />
          </label>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "1em" }}>
          <button type="submit">Search</button>
          <button
            type="button"
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
        </div>
      </form>

  {/* Results table or no-results message */}
      {tasks.length === 0 && (category || status || from || to)
        ? (<div style={{ margin: "1em 0", color: "#888" }}>No completed tasks found for the selected filters.</div>)
        : tasks.length > 0
          ? (
            <div style={{ width: "100%", overflowX: "auto", maxHeight: "500px", overflowY: "auto", margin: "1em 0", borderRadius: "8px", border: "1px solid #ccc" }}>
              <table style={{ minWidth: 900, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f0f0f0" }}>
                    <th style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>Title</th>
                    <th style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>Category</th>
                    <th style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>Due Date</th>
                    <th style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>Completed Date</th>
                    <th style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>Status</th>
                    <th style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>User</th>
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
                          ? formatDateDDMMYYYY(task.dueDate)
                          : (typeof task.dueDate === "string" && !isNaN(Date.parse(task.dueDate))
                            ? formatDateDDMMYYYY(task.dueDate)
                            : <span style={{color: '#888'}}>No due date</span>)}
                      </td>
                      <td style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>
                        {task.completedAt
                          ? formatDateDDMMYYYY(task.completedAt)
                          : "N/A"}

                      </td>
                      <td style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>
                        <select
                          value={task.status}
                          onChange={e => {
                            const newStatus = e.target.value;
                            const token = localStorage.getItem("token");
                            const apiBase = process.env.REACT_APP_API_URL || "";
                            fetch(`${apiBase}/api/tasks/${task.id}/status`, {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                                "Authorization": token ? `Bearer ${token}` : "",
                              },
                              body: JSON.stringify({ status: newStatus })
                            })
                              .then(res => {
                                if (!res.ok) throw new Error("Failed to update status");
                                setToast({ message: "Status updated successfully!", type: "success" });
                                setSearchTrigger(searchTrigger + 1);
                              })
                              .catch(err => {
                                setToast({ message: "Error updating status: " + String(err), type: "error" });
                              });
                          }}
                          style={{ minWidth: 120 }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In-Progress">In-Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      </td>
                      <td style={{ border: "1px solid #ccc", padding: "0.5em", wordBreak: "break-word" }}>{task.user?.email || "N/A"}</td>
                      <td style={{ border: "1px solid #ccc", padding: "0.5em", whiteSpace: "nowrap" }}>
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
          )
          : null
      }

  {/* Pagination controls */}
      <div style={{ marginBottom: "1em" }}>
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
        <span style={{ margin: "0 1em" }}> Page {page} of {Math.ceil(total / pageSize) || 1} </span>
        <button onClick={() => setPage(page + 1)} disabled={page * pageSize >= total}>Next</button>
      </div>

  {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default MaintenanceTaskLog;
