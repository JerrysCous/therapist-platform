// src/therapist-dashboard.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://127.0.0.1:4000";

export default function TherapistDashboard() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No login found. Please sign in again.");
      navigate("/");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    async function fetchData() {
      try {
        // Get therapist info + their linked clients in parallel
        const [meRes, clientsRes] = await Promise.all([
          axios.get(`${API_BASE}/me`, { headers }),
          axios.get(`${API_BASE}/therapist/clients`, { headers }),
        ]);

        setMe(meRes.data.user);
        setClients(clientsRes.data.clients || []);
      } catch (err) {
        console.error("TherapistDashboard error:", err.response?.data || err);
        setError("Auth failed, please log in again.");
        localStorage.removeItem("token");
        navigate("/");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [navigate]);

  if (loading) {
    return <div>Loading secure therapist data…</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Therapist Dashboard</h1>

      {/* Therapist info */}
      <section style={{ marginTop: "16px" }}>
        <h2>Your Info</h2>
        <p>
          <strong>Name:</strong> {me.name}
        </p>
        <p>
          <strong>Email:</strong> {me.email}
        </p>
        <p>
          <strong>Role:</strong> {me.role}
        </p>
      </section>

      {/* Client list */}
      <section style={{ marginTop: "24px" }}>
        <h2>Your Clients ({clients.length})</h2>

        {clients.length === 0 ? (
          <p>You don't have any linked clients yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {clients.map((client) => (
              <li
                key={client.id}
                style={{
                  marginBottom: "12px",
                  padding: "8px 0",
                  borderBottom: "1px solid #ddd",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{client.name || "Unnamed client"}</strong> —{" "}
                  <span>{client.email}</span>
                </div>

            <button onClick={() => navigate(`/chat/${client.id}`)}>
              Message
            </button>

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


