import { useEffect, useState } from "react";
import axios from "axios";
import ClientRequestAppointment from "../appointments/ClientRequestAppointment";

export default function ClientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return (window.location.href = "/");

    axios
      .get("http://127.0.0.1:4000/client/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Client dashboard error:", err.response?.data || err);
        window.location.href = "/";
      });
  }, []);

  if (loading) return <h2>Loading Client Dashboard...</h2>;

  const { therapist, appointments, profile } = data;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Client Dashboard</h1>

      {/* --- Therapist --- */}
      <h2>Your Therapist</h2>
      {therapist ? (
        <p>
          <strong>{therapist.name}</strong> ({therapist.email})
        </p>
      ) : (
        <p>No therapist assigned yet.</p>
      )}

      {/* --- Client Profile --- */}
      <h2>Your Profile</h2>
      <p>
        <strong>Notes:</strong> {profile?.notes || "None"}
      </p>
      <p>
        <strong>Preferences:</strong> {profile?.preferences || "None"}
      </p>
      <p>
        <strong>Emergency Contact:</strong>{" "}
        {profile?.emergencyContact || "Not set"}
      </p>

      {/* --- Appointment Request --- */}
      <h2>Request Appointment</h2>
      <ClientRequestAppointment therapist={therapist} />

      {/* --- Upcoming Appointments --- */}
      <h2>Upcoming Appointments</h2>
      {appointments.length === 0 ? (
        <p>No appointments scheduled</p>
      ) : (
        <ul>
          {appointments.map((appt) => (
            <li key={appt.id}>
              {new Date(appt.time).toLocaleString()} —{" "}
              {appt.therapist?.name || "Unknown Therapist"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
