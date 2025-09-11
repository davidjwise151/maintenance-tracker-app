import React, { useState, useEffect } from "react";
import CreateTaskForm from "./CreateTaskForm";

const CompletedTasksReport: React.FC = () => {
  const [tasks, setTasks] = useState([]);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Done");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [searchTrigger, setSearchTrigger] = useState(0);

  // Refresh tasks after creating a new one
  const refreshTasks = () => {
    const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (status) params.append("status", status);
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    params.append("page", String(page));
    params.append("pageSize", String(pageSize));

    fetch(`/api/tasks/completed?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setTasks(data.tasks || []);
        setTotal(data.total || 0);
      });
  };

  useEffect(() => {
    refreshTasks();
  }, [page, pageSize, searchTrigger]);

  return (
    <div>
      <CreateTaskForm onTaskCreated={refreshTasks} />
      <h2>Completed Tasks Report</h2>
      <form
        onSubmit={e => {
          e.preventDefault();
          setPage(1);
          setSearchTrigger(searchTrigger + 1);
        }}
        style={{ marginBottom: "1em" }}
      >
      <label htmlFor="status-filter" style={{ marginRight: "1em" }}>
        <strong>Status:</strong>
        <select id="status-filter" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="Pending">Pending</option>
          <option value="In-Progress">In-Progress</option>
          <option value="Done">Done</option>
        </select>
      </label>
      <label htmlFor="category-filter" style={{ marginRight: "1em" }}>
        <strong>Category:</strong>
        <input id="category-filter" value={category} onChange={e => setCategory(e.target.value)} placeholder="Category" />
      </label>
      <label>
        From:
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
      </label>
      <label>
        To:
        <input type="date" value={to} onChange={e => setTo(e.target.value)} />
      </label>
      <label>
        Page Size:
        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
          {[5, 10, 20, 50].map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </label>
        <button type="submit" style={{ marginLeft: "1em" }}>Search</button>
      </form>
      <ul>
        {tasks.map((task: any) => (
          <li key={task.id}>
            {task.title} ({task.category || "Uncategorized"}) - Completed: {task.completedAt ? new Date(Number(task.completedAt)).toLocaleDateString() : "N/A"}
          </li>
        ))}
      </ul>
      <div>
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
        <span> Page {page} of {Math.ceil(total / pageSize) || 1} </span>
        <button onClick={() => setPage(page + 1)} disabled={page * pageSize >= total}>Next</button>
      </div>
      <div>Total Completed Tasks: {total}</div>
    </div>
  );
};

export default CompletedTasksReport;