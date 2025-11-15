import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import AvailabilityForm from "./AvailabilityForm";

export default function TherapistDashboard() {
  const [profile, setProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // ------------------------------
  // LOAD AVAILABILITY (Wrapped in useCallback)
  // ------------------------------
  const loadAvailability = useCallback(async () => {
    try {
      const res = await axios.get("http://127.0.0.1:4000/availability/get", {
        headers: { Authorization: "Bearer " + token }
      });

      setAvailability(res.data.slots || []);
    } catch (err) {
      console.error("Failed to load availability:", err.response?.data || err);
      setAvailability([]);
    }
  }, [token]);

  // ------------------------------
  // LOAD DASHBOARD (Profile / Clients / Appts)
  // ------------------------------
  useEffect(() => {
    if (!token) return (window.location.href = "/");

    axios
      .get("http://127.0.0.1:4000/therapist/dashboard", {
        headers: { Authorization: "Bearer " + token }
      })
      .then((res) => {
        setProfile(res.data.profile);
        setClients(res.data.clients);
        setAppointments(res.data.appointments);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard load error:", err.response?.data || err);
        alert("Error loading therapist dashboard");
        window.location.href = "/";
      });

    loadAvailability();
  }, [token, loadAvailability]);

  // ------------------------------
  // REMOVE AVAILABILITY SLOT
  // ------------------------------
  const removeSlot = async (id) => {
    if (!window.confirm("Remove this availability slot?")) return;

    try {
      await axios.delete(`http://127.0.0.1:4000/availability/delete/${id}`, {
        headers: { Authorization: "Bearer " + token }
      });

      setAvailability((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Delete slot error:", err.response?.data || err);
      alert("Failed to delete slot");
    }
  };

  // ------------------------------
  // RENDER LOADING
  // ------------------------------
  if (loading) return <h2>Loading Therapist Dashboard...</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Therapist Dashboard</h1>

      {/* ---------------- PROFILE ---------------- */}
      <h2>Profile</h2>
      <p><strong>Bio:</strong> {profile?.bio || "No bio"}</p>
      <p><strong>Specialization:</strong> {profile?.specialization || "None"}</p>

      {/* ---------------- AVAILABILITY ---------------- */}
      <h2>Your Availability</h2>

      {availability.length === 0 ? (
        <p>No availability set.</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "500px", marginBottom: "20px" }}>
          <thead>
            <tr>
              <th style={th}>Day</th>
              <th style={th}>Start</th>
              <th style={th}>End</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {availability.map((slot) => (
              <tr key={slot.id}>
                <td style={td}>{weekdayName(slot.weekday)}</td>
                <td style={td}>{slot.startTime}</td>
                <td style={td}>{slot.endTime}</td>
                <td style={td}>
                  <button
                    onClick={() => removeSlot(slot.id)}
                    style={{
                      background: "red",
                      color: "white",
                      padding: "5px 10px",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add availability form */}
      <AvailabilityForm refresh={loadAvailability} />

      {/* ---------------- CLIENTS ---------------- */}
      <h2>Clients</h2>
      <ul>
        {clients.length === 0 ? <li>No clients</li> : clients.map((c) => (
          <li key={c.id}>{c.name} ({c.email})</li>
        ))}
      </ul>

      {/* ---------------- APPOINTMENTS ---------------- */}
      <h2>Appointments</h2>
      <ul>
        {appointments.length === 0 ? (
          <li>No appointments</li>
        ) : (
          appointments.map((a) => (
            <li key={a.id}>
              {new Date(a.time).toLocaleString()} — {a.client?.name}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

// --------------------
// Helper Functions
// --------------------
function weekdayName(num) {
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][num];
}

const th = {
  border: "1px solid #ccc",
  padding: "8px",
  background: "#f5f5f5",
};

const td = {
  border: "1px solid #ccc",
  padding: "8px",
};
