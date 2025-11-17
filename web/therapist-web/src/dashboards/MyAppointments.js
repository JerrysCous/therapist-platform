import { useEffect, useState, useCallback } from "react";
import axios from "axios";

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [rescheduleId, setRescheduleId] = useState(null);
  const [newTime, setNewTime] = useState("");

  const loadAppointments = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://127.0.0.1:4000/client/my-appointments",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAppointments(res.data.appointments || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const requestReschedule = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `http://127.0.0.1:4000/client/appointments/${id}/reschedule`,
        { newTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(res.data.message || "Reschedule requested.");
      setRescheduleId(null);
      setNewTime("");
      loadAppointments();
    } catch (err) {
      console.error(err);
      setMessage("Failed to request reschedule.");
    }
  };

  if (loading) return <p>Loading appointments...</p>;

  const now = new Date();

  return (
    <div style={{ padding: "20px" }}>
      <h1>My Appointments</h1>

      {message && <p style={{ color: "green" }}>{message}</p>}

      {appointments.length === 0 ? (
        <p>You have no appointments.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {appointments.map((appt) => {
            const apptTime = new Date(appt.time);
            const isFuture = apptTime > now;

            return (
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
                  <strong>Therapist:</strong> {appt.therapist.name}
                </p>
                <p>
                  <strong>Date:</strong> {apptTime.toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong> {appt.status}
                </p>

                {/* BEGIN RESCHEDULE UI */}
                {isFuture && ["CONFIRMED", "PENDING"].includes(appt.status) && (
                  <>
                    {rescheduleId === appt.id ? (
                      <div style={{ marginTop: "10px" }}>
                        <input
                          type="datetime-local"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                        />
                        <button
                          onClick={() => requestReschedule(appt.id)}
                          style={{ marginLeft: "10px" }}
                        >
                          Submit Request
                        </button>
                        <button
                          style={{ marginLeft: "10px", color: "red" }}
                          onClick={() => {
                            setRescheduleId(null);
                            setNewTime("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        style={{ marginTop: "10px" }}
                        onClick={() => setRescheduleId(appt.id)}
                      >
                        Request Reschedule
                      </button>
                    )}
                  </>
                )}
                {/* END RESCHEDULE UI */}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

