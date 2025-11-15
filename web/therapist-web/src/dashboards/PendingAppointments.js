import { useEffect, useState } from "react";
import axios from "axios";

export default function PendingAppointments() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return (window.location.href = "/");

    axios
      .get("http://127.0.0.1:4000/appointments/pending", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setPending(res.data.pending || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Pending appointments error:", err.response?.data || err);
        window.location.href = "/";
      });
  }, [token]);

  // --------------------------------------
  // APPROVE REQUEST
  // --------------------------------------
  const approve = async (id) => {
    try {
      await axios.post(
        `http://127.0.0.1:4000/appointments/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPending(prev => prev.filter((appt) => appt.id !== id));
    } catch (err) {
      console.error("Approve error:", err.response?.data || err);
      alert("Failed to approve appointment.");
    }
  };

  // --------------------------------------
  // DENY REQUEST
  // --------------------------------------
  const deny = async (id) => {
    try {
      await axios.post(
        `http://127.0.0.1:4000/appointments/${id}/deny`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPending(prev => prev.filter((appt) => appt.id !== id));
    } catch (err) {
      console.error("Deny error:", err.response?.data || err);
      alert("Failed to deny appointment.");
    }
  };

  if (loading) return <h2>Loading Pending Appointments...</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Pending Appointment Requests</h1>

      {pending.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <ul>
          {pending.map((appt) => (
            <li key={appt.id} style={{ marginBottom: "15px" }}>
              <strong>{appt.client?.name}</strong> ({appt.client?.email})
              <br />
              <span>{new Date(appt.time).toLocaleString()}</span>
              <br />

              <button
                onClick={() => approve(appt.id)}
                style={{
                  marginTop: "8px",
                  marginRight: "10px",
                  background: "green",
                  color: "white",
                  border: "none",
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                Approve
              </button>

              <button
                onClick={() => deny(appt.id)}
                style={{
                  marginTop: "8px",
                  background: "red",
                  color: "white",
                  border: "none",
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                Deny
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
