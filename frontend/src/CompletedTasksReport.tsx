import React, { useState, useEffect } from "react";

const CompletedTasksReport: React.FC = () => {
  const [tasks, setTasks] = useState([]);
  const [category, setCategory] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    fetch(`/api/tasks/completed?${params.toString()}`)
      .then(res => res.json())
      .then(setTasks);
  }, [category, from, to]);

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
      <ul>
        {tasks.map((task: any) => (
          <li key={task.id}>
            {task.title} ({task.category}) - Completed: {task.completedAt}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CompletedTasksReport;