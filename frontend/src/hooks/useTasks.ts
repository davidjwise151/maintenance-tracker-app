
import { useState, useCallback } from "react";
import { parseDateInput } from "../utils/dateUtils";

type TaskFilters = {
  category?: string;
  status?: string;
  from?: string;
  to?: string;
  dueFrom?: string;
  dueTo?: string;
};


interface UseTasksOptions {
  initialFilters?: TaskFilters;
  pageSize?: number;
}

export function useTasks({
  initialFilters = {},
  pageSize: initialPageSize = 25,
}: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (filters.category) params.append("category", filters.category);
    if (filters.status) params.append("status", filters.status);
    if (filters.from) {
      const fromDate = parseDateInput(filters.from);
      if (fromDate) params.append("from", fromDate.getTime().toString());
    }
    if (filters.to) {
      const toDate = parseDateInput(filters.to);
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
        params.append("to", toDate.getTime().toString());
      }
    }
    if (filters.dueFrom) {
      const dueFromDate = parseDateInput(filters.dueFrom);
      if (dueFromDate) params.append("dueFrom", dueFromDate.getTime().toString());
    }
    if (filters.dueTo) {
      const dueToDate = parseDateInput(filters.dueTo);
      if (dueToDate) {
        dueToDate.setHours(23, 59, 59, 999);
        params.append("dueTo", dueToDate.getTime().toString());
      }
    }
    params.append("page", String(page));
    params.append("pageSize", String(pageSize));
    const token = sessionStorage.getItem("token");
    const apiBase = process.env.REACT_APP_API_URL || "";
    fetch(`${apiBase}/api/tasks?${params.toString()}`,
      { headers: { Authorization: token ? `Bearer ${token}` : "" } })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch tasks");
        return res.json();
      })
      .then(data => {
        setTasks(data.tasks || []);
        setTotal(data.total || 0);
        setError("");
      })
      .catch(err => {
        setTasks([]);
        setTotal(0);
        setError("Error loading tasks. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, [filters, page, pageSize]);

  return {
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
  };
}
