import { useState, useEffect } from "react";
import { apiFetch } from "../utils/apiFetch";

export interface User {
  id: string;
  email: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiFetch("/api/users")
      .then(res => res.ok ? res.json() : Promise.resolve({ users: [] }))
      .then(data => {
        setUsers(data.users || []);
        setError(null);
      })
      .catch(err => {
        setUsers([]);
        setError("Failed to load users");
      })
      .finally(() => setLoading(false));
  }, []);

  return { users, loading, error };
}
