import { useEffect, useState } from "react";
import axios from "axios";

export default function TherapistManageAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get("http://127.0.0.1:4000/appointments", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        // Therapist only sees their own appointments
        setAppointments(res.data.appointments || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Therapist appointments load error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.post(
        `http://127.0.0.1:4000/appointments/${id}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      loadAppointments();
    } catch (err) {
      console.error("Update appointment status error:", err);
      alert(err.response?.data?.error || "Failed to update appointment");
    }
  };

  if (loading) return <h2>Loading Appointments...</h2>;

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Manage Your Appointments</h2>

      {appointments.length === 0 ? (
        <p>No appointment requests yet.</p>
      ) : (
        <ul>
          {appointments.map((appt) => (
            <li key={appt.id} style={{ marginBottom: 10 }}>
              <strong>{appt.client.name}</strong> —{" "}
              {new Date(appt.time).toLocaleString()}
              <br />
              Status: <strong>{appt.status}</strong>

              {appt.status === "PENDING" && (
                <>
                  <br />
                  <button onClick={() => updateStatus(appt.id, "CONFIRMED")}>
                    Approve
                  </button>

                  <button
                    onClick={() => updateStatus(appt.id, "CANCELLED")}
                    style={{ marginLeft: 10 }}
                  >
                    Deny
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
