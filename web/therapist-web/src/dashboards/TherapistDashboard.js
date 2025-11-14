import { useEffect, useState } from "react";
import axios from "axios";

export default function TherapistDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return (window.location.href = "/");

    axios.get("http://127.0.0.1:4000/therapist/dashboard", {
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        console.log("THERAPIST DASHBOARD RESPONSE:", res.data);
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Therapist dashboard load error:", err.response?.data || err);
        alert("Error loading therapist dashboard");
        window.location.href = "/";
      });
  }, []);

  if (loading) return <h2>Loading Therapist Dashboard...</h2>;

  const { profile, clients, appointments } = data;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Therapist Dashboard</h1>

      <h2>Profile</h2>
      <p><strong>Bio:</strong> {profile?.bio || "No bio"}</p>
      <p><strong>Specialization:</strong> {profile?.specialization || "None"}</p>
      <p><strong>Availability:</strong> {profile?.availability || "Not set"}</p>

      <h2>Clients</h2>
      <ul>
        {clients.length === 0 ? (
          <li>No clients yet</li>
        ) : (
          clients.map((c) => (
            <li key={c.id}>{c.name} ({c.email})</li>
          ))
        )}
      </ul>

      <h2>Appointments</h2>
      <ul>
        {appointments.length === 0 ? (
          <li>No appointments</li>
        ) : (
          appointments.map((appt) => (
            <li key={appt.id}>
              {new Date(appt.time).toLocaleString()} — {appt.client?.name}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
