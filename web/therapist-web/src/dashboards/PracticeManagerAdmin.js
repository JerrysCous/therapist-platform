import { useEffect, useState } from "react";
import axios from "axios";

const ROLES = [
  "OWNER",
  "PRACTICE_MANAGER_ADMIN",
  "PRACTICE_MANAGER_CLINICAL",
  "THERAPIST",
  "INTERN",
  "CLIENT",
];

export default function PracticeManagerAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return (window.location.href = "/");

    axios
      .get("http://127.0.0.1:4000/practice-manager-admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUsers(res.data.users || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Admin dashboard load error:", err.response?.data || err);
        setError("Failed to load admin dashboard");
        setLoading(false);
      });
  }, []);

  // ----------------------
  // UPDATE ROLE
  // ----------------------
  const handleRoleChange = async (userId, newRole) => {
    const token = localStorage.getItem("token");
    if (!token) return (window.location.href = "/");

    try {
      const res = await axios.post(
        `http://127.0.0.1:4000/practice-manager-admin/users/${userId}/role`,
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedUser = res.data.user;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updatedUser.role } : u))
      );
    } catch (err) {
      console.error("Role update error:", err.response?.data || err);
      alert("Could not update role: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  // ----------------------
  // DELETE USER
  // ----------------------
  const handleDeleteUser = async (userId, userName, userRole) => {
    const token = localStorage.getItem("token");
    if (!token) return (window.location.href = "/");

    if (userRole === "OWNER") {
      return alert("You cannot delete an OWNER account.");
    }

    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return;

    try {
      await axios.delete(
        `http://127.0.0.1:4000/practice-manager-admin/users/${userId}/delete`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Remove from UI
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("Delete user error:", err.response?.data || err);
      alert(err.response?.data?.error || "Could not delete user");
    }
  };

  if (loading) return <h2>Loading Practice Manager Admin Dashboard...</h2>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Practice Manager Admin Dashboard</h1>

      <h2>All Users</h2>

      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          maxWidth: "900px",
        }}
      >
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Name</th>
            <th style={th}>Email</th>
            <th style={th}>Role</th>
            <th style={th}>Created</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={td}>{u.id}</td>
              <td style={td}>{u.name}</td>
              <td style={td}>{u.email}</td>

              <td style={td}>
                {u.role === "OWNER" ? (
                  <strong>OWNER</strong>
                ) : (
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                )}
              </td>

              <td style={td}>
                {new Date(u.createdAt).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </td>

              {/* DELETE BUTTON */}
              <td style={td}>
                {u.role === "OWNER" ? (
                  <em>Protected</em>
                ) : (
                  <button
                    style={{
                      background: "red",
                      color: "white",
                      padding: "5px 10px",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onClick={() => handleDeleteUser(u.id, u.name, u.role)}
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
  );
}

const th = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "left",
  background: "#f5f5f5",
};

const td = {
  border: "1px solid #ccc",
  padding: "8px",
};


