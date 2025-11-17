import { useEffect, useState, useCallback } from "react";
import axios from "axios";

export default function PendingAppointments() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadPending = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://127.0.0.1:4000/appointments/pending",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPending(res.data.pending || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load pending appointments.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  async function handleDecision(id, decision) {
    const endpoint =
      decision === "approve"
        ? `/appointments/${id}/approve`
        : `/appointments/${id}/deny`;

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `http://127.0.0.1:4000${endpoint}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(res.data.message || "Updated.");
      loadPending();
    } catch (err) {
      console.error(err);
      setMessage("Failed to update appointment.");
    }
  }

  if (loading) return <p>Loading pending requests...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Pending Appointment Requests</h1>

      {message && <p style={{ color: "green" }}>{message}</p>}

      {pending.length === 0 ? (
        <p>No pending appointments.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {pending.map((appt) => (
            <li
              key={appt.id}
              style={{
                marginBottom: "20px",
                border: "1px solid #ccc",
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              <p><strong>Client:</strong> {appt.client.name}</p>
              <p><strong>Time:</strong> {new Date(appt.time).toLocaleString()}</p>

              <button
                onClick={() => handleDecision(appt.id, "approve")}
                style={{ marginRight: "10px" }}
              >
                Approve
              </button>

              <button
                onClick={() => handleDecision(appt.id, "deny")}
                style={{ background: "red", color: "white" }}
              >
                Decline
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
