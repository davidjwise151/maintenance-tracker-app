import React, { useState, useEffect } from "react";

const CompletedTasksReport: React.FC = () => {
  const [tasks, setTasks] = useState([]);
  const [category, setCategory] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
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
  }, [category, from, to, page, pageSize]);

  return (
    <div>
      <h2>Completed Tasks Report</h2>
      <label>
        Category:
        <input value={category} onChange={e => setCategory(e.target.value)} />
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