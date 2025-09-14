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
    <div style={{
      margin: "2em 0",
      padding: "2em",
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      maxWidth: 600,
      marginLeft: "auto",
      marginRight: "auto"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.2em" }}>
        <svg width="36" height="36" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 12 }}>
          <circle cx="22" cy="22" r="20" fill="#2980b9" />
          <path d="M14 28c0-6 8-6 8-12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="22" cy="16" r="2.5" fill="#fff" />
        </svg>
        <h2 style={{
          fontFamily: 'SF Pro Display, Helvetica Neue, Arial, sans-serif',
          fontWeight: 700,
          fontSize: '2rem',
          color: '#222',
          letterSpacing: '-0.02em',
          textAlign: 'center',
          textShadow: '0 2px 8px rgba(0,0,0,0.08)',
          margin: 0
        }}>User Management</h2>
      </div>
      <div style={{ textAlign: "center", color: "#888", fontSize: "1.08rem", marginBottom: "1.2em" }}>
        <span>Manage user accounts, roles, and permissions with ease.</span>
      </div>
      {loading ? (
        <div style={{ color: "#888", textAlign: "center", fontSize: "1.1rem" }}>Loading users...</div>
      ) : (
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#f9f9f9",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <thead>
            <tr style={{ background: "#f5f5f7" }}>
              <th style={{ padding: "0.8em", borderBottom: "2px solid #e0e0e0", fontWeight: 600, color: "#222", fontSize: "1.08rem", textAlign: "left" }}>Email</th>
              <th style={{ padding: "0.8em", borderBottom: "2px solid #e0e0e0", fontWeight: 600, color: "#222", fontSize: "1.08rem", textAlign: "left" }}>Role</th>
              <th style={{ padding: "0.8em", borderBottom: "2px solid #e0e0e0", fontWeight: 600, color: "#222", fontSize: "1.08rem", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", transition: "background 0.2s" }}>
                <td style={{ padding: "0.7em", color: "#444", fontSize: "1.08rem", fontWeight: 500 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 2 }}>
                      <circle cx="12" cy="12" r="9" fill="#f5f5f7" />
                      <path d="M12 14c2.5 0 4.5-2 4.5-4.5S14.5 5 12 5 7.5 7 7.5 9.5 9.5 14 12 14z" fill="#2980b9" />
                    </svg>
                    {user.email}
                  </span>
                </td>
                <td style={{ padding: "0.7em", color: user.role === "admin" ? "#2980b9" : "#888", fontWeight: user.role === "admin" ? 700 : 500, fontSize: "1.08rem" }}>
                  {editUserId === user.id ? (
                    <select value={editRole} onChange={e => setEditRole(e.target.value)} style={{ fontSize: "1rem", padding: "0.3em 0.6em", borderRadius: 6, border: "1px solid #e0e0e0", background: "#f5f5f7" }}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {user.role === "admin" ? (
                        <span style={{ color: "#2980b9", fontWeight: 700, background: "#eaf3fb", borderRadius: 6, padding: "0.2em 0.7em", fontSize: "0.98rem" }}>Admin</span>
                      ) : (
                        <span style={{ color: "#888", fontWeight: 500, background: "#f5f5f7", borderRadius: 6, padding: "0.2em 0.7em", fontSize: "0.98rem" }}>User</span>
                      )}
                    </span>
                  )}
                </td>
                <td style={{ padding: "0.7em" }}>
                  {editUserId === user.id ? (
                    <>
                      <button onClick={() => handleEditRole(user.id)} style={{
                        marginRight: 8,
                        background: "#2980b9",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "0.4em 1em",
                        fontWeight: 600,
                        fontSize: "1rem",
                        cursor: "pointer",
                        boxShadow: "0 1px 4px rgba(41,128,185,0.08)"
                      }}>Save</button>
                      <button onClick={() => { setEditUserId(""); setEditRole(""); }} style={{
                        background: "#f5f5f7",
                        color: "#888",
                        border: "none",
                        borderRadius: 6,
                        padding: "0.4em 1em",
                        fontWeight: 500,
                        fontSize: "1rem",
                        cursor: "pointer"
                      }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditUserId(user.id); setEditRole(user.role); }} style={{
                        marginRight: 8,
                        background: "#f5f5f7",
                        color: "#2980b9",
                        border: "1px solid #e0e0e0",
                        borderRadius: 6,
                        padding: "0.4em 1em",
                        fontWeight: 600,
                        fontSize: "1rem",
                        cursor: "pointer"
                      }}>
                        <span style={{ marginRight: 4, fontSize: "1.1em" }}>✏️</span>Edit Role
                      </button>
                      <button onClick={() => handleDeleteUser(user.id)} style={{
                        background: "#e74c3c",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "0.4em 1em",
                        fontWeight: 600,
                        fontSize: "1rem",
                        cursor: "pointer",
                        boxShadow: "0 1px 4px rgba(231,76,60,0.08)"
                      }}>
                        <span style={{ marginRight: 4, fontSize: "1.1em" }}>🗑️</span>Delete
                      </button>
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
