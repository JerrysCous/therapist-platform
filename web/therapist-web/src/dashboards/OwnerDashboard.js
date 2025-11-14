import { useEffect, useState } from "react";
import axios from "axios";

export default function OwnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "/";

    axios
      .get("http://127.0.0.1:4000/owner/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Owner dashboard error:", err);
        window.location.href = "/";
      });
  }, []);

  if (loading) return <h2>Loading Owner Dashboard...</h2>;

  const { stats, upcomingAppointments, recentUsers } = data;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Owner Dashboard</h1>

      {/* TOP STAT CARDS */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <StatCard title="Total Users" value={stats.users.total} />
        <StatCard title="Therapists" value={stats.users.therapists} />
        <StatCard title="Clients" value={stats.users.clients} />
        <StatCard title="Interns" value={stats.users.interns} />
        <StatCard
          title="Practice Admins"
          value={stats.users.practiceManagersAdmin}
        />
        <StatCard
          title="Practice Clinical"
          value={stats.users.practiceManagersClinical}
        />
        <StatCard title="Messages" value={stats.messages.total} />
        <StatCard title="Appointments" value={stats.appointments.total} />
      </div>

      <br />

      {/* UPCOMING APPOINTMENTS */}
      <h2>Upcoming Appointments</h2>
      {upcomingAppointments.length === 0 ? (
        <p>No upcoming appointments</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Date</th>
              <th>Therapist</th>
              <th>Client</th>
            </tr>
          </thead>
          <tbody>
            {upcomingAppointments.map((appt) => (
              <tr key={appt.id}>
                <td>{new Date(appt.time).toLocaleString()}</td>
                <td>{appt.therapist?.name}</td>
                <td>{appt.client?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <br />

      {/* RECENT USERS */}
      <h2>Recent Users</h2>
      {recentUsers.length === 0 ? (
        <p>No recent users</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{new Date(u.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* Small stat card */
function StatCard({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "6px",
        padding: "15px",
        minWidth: "150px",
        textAlign: "center",
        background: "#fafafa",
      }}
    >
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p style={{ fontSize: "22px", fontWeight: "bold" }}>{value}</p>
    </div>
  );
}
