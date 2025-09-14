import React, { useEffect, useState, useCallback, useContext } from "react";
import { ToastManagerContext } from "./ToastManager";

interface UserManagementProps {
  userRole?: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ userRole }) => {
  const [users, setUsers] = useState<Array<{ id: string; email: string; role: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [editUserId, setEditUserId] = useState<string>("");
  const [editRole, setEditRole] = useState<string>("");
  const [permissionError, setPermissionError] = useState<string>("");
  const toastManager = useContext(ToastManagerContext);

  useEffect(() => {
    if (userRole === "admin") {
      const fetchUsers = async () => {
        setLoading(true);
        setPermissionError("");
        const token = sessionStorage.getItem("token");
        const apiBase = process.env.REACT_APP_API_URL || "";
        try {
          const res = await fetch(`${apiBase}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.status === 403) {
            setPermissionError("You do not have permission to view users. Please log in as an admin.");
            setUsers([]);
            return;
          }
          if (!res.ok) throw new Error("Failed to fetch users");
          const data = await res.json();
          setUsers(data.users || []);
        } catch (err) {
          toastManager?.showToast("Error fetching users: " + String(err), "error");
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [userRole, toastManager]);

  // Edit user role
  const handleEditRole = async (userId: string) => {
    if (!editRole) return;
    const token = sessionStorage.getItem("token");
    const apiBase = process.env.REACT_APP_API_URL || "";
    try {
      const res = await fetch(`${apiBase}/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ role: editRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      toastManager?.showToast("Role updated!", "success");
      setEditUserId("");
      setEditRole("");
      // Refetch users after role update
      if (userRole === "admin") {
        setLoading(true);
        try {
          const res = await fetch(`${apiBase}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch users");
          const data = await res.json();
          setUsers(data.users || []);
        } catch (err) {
          toastManager?.showToast("Error fetching users: " + String(err), "error");
        } finally {
          setLoading(false);
        }
      }
    } catch (err) {
      toastManager?.showToast("Error updating role: " + String(err), "error");
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    const token = sessionStorage.getItem("token");
    const apiBase = process.env.REACT_APP_API_URL || "";
    try {
      const res = await fetch(`${apiBase}/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete user");
      toastManager?.showToast("User deleted!", "success");
      // Refetch users after deletion
      if (userRole === "admin") {
        setLoading(true);
        try {
          const res = await fetch(`${apiBase}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch users");
          const data = await res.json();
          setUsers(data.users || []);
        } catch (err) {
          toastManager?.showToast("Error fetching users: " + String(err), "error");
        } finally {
          setLoading(false);
        }
      }
    } catch (err) {
      toastManager?.showToast("Error deleting user: " + String(err), "error");
    }
  };

  if (userRole !== "admin") return null;
  if (permissionError) {
    return (
      <div style={{ margin: "2em 0", padding: "2em", background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", color: "#e74c3c" }}>
        <h3>User Management</h3>
        <div>{permissionError}</div>
      </div>
    );
  }

  return (
    <div style={{ margin: "2em 0", padding: "2em", background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <h3 style={{ marginBottom: "1em" }}>User Management</h3>
      {loading ? (
        <div>Loading users...</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ padding: "0.5em", border: "1px solid #ccc" }}>Email</th>
              <th style={{ padding: "0.5em", border: "1px solid #ccc" }}>Role</th>
              <th style={{ padding: "0.5em", border: "1px solid #ccc" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ padding: "0.5em", border: "1px solid #ccc" }}>{user.email}</td>
                <td style={{ padding: "0.5em", border: "1px solid #ccc" }}>
                  {editUserId === user.id ? (
                    <select value={editRole} onChange={e => setEditRole(e.target.value)}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : (
                    user.role
                  )}
                </td>
                <td style={{ padding: "0.5em", border: "1px solid #ccc" }}>
                  {editUserId === user.id ? (
                    <>
                      <button onClick={() => handleEditRole(user.id)} style={{ marginRight: 8 }}>Save</button>
                      <button onClick={() => { setEditUserId(""); setEditRole(""); }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditUserId(user.id); setEditRole(user.role); }} style={{ marginRight: 8 }}>Edit Role</button>
                      <button onClick={() => handleDeleteUser(user.id)} style={{ color: "#e74c3c" }}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagement;
