import { useEffect, useState } from "react";
import axios from "axios";

export default function TherapistRescheduleDirect() {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [newTime, setNewTime] = useState("");

  const loadAppointments = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("http://127.0.0.1:4000/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAppts(res.data.appointments || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const save = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `http://127.0.0.1:4000/therapist/appointments/${id}/reschedule-change`,
        { newTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEditing(null);
      setNewTime("");
      loadAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Direct Reschedule Appointments</h1>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {appts.map((a) => (
          <li
            key={a.id}
            style={{
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <p><strong>Client:</strong> {a.client.name}</p>
            <p><strong>Time:</strong> {new Date(a.time).toLocaleString()}</p>

            {editing === a.id ? (
              <>
                <input
                  type="datetime-local"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
                <button onClick={() => save(a.id)} style={{ marginLeft: "10px" }}>
                  Save
                </button>
                <button
                  onClick={() => setEditing(null)}
                  style={{ marginLeft: "10px", color: "red" }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(a.id)}>Reschedule</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
