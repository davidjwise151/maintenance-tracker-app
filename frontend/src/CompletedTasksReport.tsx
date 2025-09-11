import React, { useState, useEffect } from "react";
import CreateTaskForm from "./CreateTaskForm";


// CompletedTasksReport component displays a report/history view of completed maintenance tasks
const CompletedTasksReport: React.FC = () => {
  // State for tasks and filter/search controls
  const [tasks, setTasks] = useState([]);
  const [category, setCategory] = useState(""); // Filter by category
  const [status, setStatus] = useState("Done"); // Filter by status
  const [from, setFrom] = useState(""); // Filter by start date
  const [to, setTo] = useState(""); // Filter by end date
  const [page, setPage] = useState(1); // Pagination: current page
  const [pageSize, setPageSize] = useState(5); // Pagination: page size
  const [total, setTotal] = useState(0); // Total number of results
  const [searchTrigger, setSearchTrigger] = useState(0); // Used to trigger search on filter change

  // Fetch completed tasks from backend with filters and pagination
  const refreshTasks = () => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (status) params.append("status", status);
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    params.append("page", String(page));
    params.append("pageSize", String(pageSize));

    // Get JWT token from localStorage for authentication
    const token = localStorage.getItem("token");
    fetch(`/api/tasks/completed?${params.toString()}`, {
      headers: {
        "Authorization": token ? `Bearer ${token}` : "",
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
        // Log error to console for debugging
        console.error(err);
      });
  };

  // Refresh tasks when page, pageSize, or searchTrigger changes
  useEffect(() => {
    refreshTasks();
  }, [page, pageSize, searchTrigger]);

  // Render UI: filter form, results table, pagination
  return (
    <div>
      {/* Form to create new tasks; triggers refresh on creation */}
      <CreateTaskForm onTaskCreated={refreshTasks} />
      <h2>Completed Tasks Report</h2>
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
          display: "flex",
          flexWrap: "wrap",
          gap: "1em"
        }}
      >
        {/* Status filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="status-filter"><strong>Status</strong></label>
          <select id="status-filter" value={status} onChange={e => setStatus(e.target.value)} style={{ minWidth: 120 }}>
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>
        {/* Category filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="category-filter"><strong>Category</strong></label>
          <input id="category-filter" value={category} onChange={e => setCategory(e.target.value)} placeholder="Category" style={{ minWidth: 120 }} />
        </div>
        {/* Date range filters */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="from-date"><strong>From Date</strong></label>
          <input id="from-date" type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="to-date"><strong>To Date</strong></label>
          <input id="to-date" type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        {/* Page size filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="page-size"><strong>Page Size</strong></label>
          <select id="page-size" value={pageSize} onChange={e => setPageSize(Number(e.target.value))} style={{ minWidth: 80 }}>
            {[5, 10, 20, 50].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        {/* Search and reset buttons */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5em" }}>
          <button type="submit" style={{ padding: "0.5em 1em" }}>Search</button>
          <button
            type="button"
            style={{ padding: "0.5em 1em" }}
            onClick={() => {
              setCategory("");
              setStatus("Done");
              setFrom("");
              setTo("");
              setPage(1);
              setSearchTrigger(searchTrigger + 1);
            }}
          >Reset Filters</button>
        </div>
      </form>

      {/* Results table or no-results message */}
      {tasks.length === 0 ? (
        <div style={{ margin: "1em 0", color: "#888" }}>No completed tasks found for the selected filters.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "1em 0" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ border: "1px solid #ccc", padding: "0.5em" }}>Title</th>
              <th style={{ border: "1px solid #ccc", padding: "0.5em" }}>Category</th>
              <th style={{ border: "1px solid #ccc", padding: "0.5em" }}>Completed Date</th>
              <th style={{ border: "1px solid #ccc", padding: "0.5em" }}>Status</th>
              <th style={{ border: "1px solid #ccc", padding: "0.5em" }}>User</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task: any) => (
              <tr key={task.id}>
                <td style={{ border: "1px solid #ccc", padding: "0.5em" }}>{task.title}</td>
                <td style={{ border: "1px solid #ccc", padding: "0.5em" }}>{task.category || "Uncategorized"}</td>
                <td style={{ border: "1px solid #ccc", padding: "0.5em" }}>{task.completedAt ? new Date(task.completedAt).toLocaleDateString() : "N/A"}</td>
                <td style={{ border: "1px solid #ccc", padding: "0.5em" }}>{task.status}</td>
                <td style={{ border: "1px solid #ccc", padding: "0.5em" }}>{task.user?.email || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Pagination controls */}
      <div style={{ marginBottom: "1em" }}>
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
        <span style={{ margin: "0 1em" }}> Page {page} of {Math.ceil(total / pageSize) || 1} </span>
        <button onClick={() => setPage(page + 1)} disabled={page * pageSize >= total}>Next</button>
      </div>
      <div>Total Completed Tasks: {total}</div>
    </div>
  );
};

export default CompletedTasksReport;