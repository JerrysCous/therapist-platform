import { useEffect, useState, useCallback } from "react";
import axios from "axios";

export default function CompletedAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCompleted = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://127.0.0.1:4000/therapist/completed-appointments",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAppointments(res.data.completed || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompleted();
  }, [loadCompleted]);

  if (loading) return <p>Loading completed appointments...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Completed Appointments</h1>

      {appointments.length === 0 ? (
        <p>No completed appointments.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {appointments.map((appt) => (
            <li
              key={appt.id}
              style={{
                marginBottom: "20px",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            >
              <p>
                <strong>Client:</strong> {appt.client.name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(appt.time).toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> Completed
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
