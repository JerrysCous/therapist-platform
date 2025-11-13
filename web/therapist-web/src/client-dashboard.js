import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:4000";

export default function ClientDashboard() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [therapist, setTherapist] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    axios
      .get(`${API_BASE}/client/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMe(res.data.clientId);
        setTherapist(res.data.therapist);
        setAppointments(res.data.appointments);
      })
      .catch((err) => {
        console.error(err);
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <div>Loading…</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Client Dashboard</h1>

      {/* Therapist Section */}
      <section style={{ marginTop: "16px" }}>
        <h2>Your Therapist</h2>

        {!therapist ? (
          <p>You are not linked to a therapist yet.</p>
        ) : (
          <>
            <p><strong>Name:</strong> {therapist.name}</p>
            <p><strong>Email:</strong> {therapist.email}</p>

            <button
              style={{ marginTop: "10px" }}
              onClick={() => navigate(`/chat/${therapist.id}`)}
            >
              Message Your Therapist
            </button>
          </>
        )}
      </section>

      {/* Appointments Section */}
      <section style={{ marginTop: "24px" }}>
        <h2>Your Appointments</h2>
        {appointments.length === 0 ? (
          <p>No appointments scheduled.</p>
        ) : (
          <ul>
            {appointments.map((a) => (
              <li key={a.id}>
                {new Date(a.time).toLocaleString()} — {a.therapist?.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        style={{ marginTop: "24px" }}
        onClick={() => {
          localStorage.removeItem("token");
          navigate("/");
        }}
      >
        Log out
      </button>
    </div>
  );
}



