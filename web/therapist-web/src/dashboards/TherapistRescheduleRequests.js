import { useEffect, useState } from "react";
import axios from "axios";

export default function TherapistRescheduleRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://127.0.0.1:4000/therapist/reschedule-requests",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRequests(res.data.requests || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const approve = async (id, newTime) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `http://127.0.0.1:4000/therapist/appointments/${id}/reschedule-approve`,
        { newTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const deny = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `http://127.0.0.1:4000/therapist/appointments/${id}/reschedule-deny`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Loading requests...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Reschedule Requests</h1>

      {requests.length === 0 ? (
        <p>No reschedule requests.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {requests.map((r) => (
            <li
              key={r.id}
              style={{
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <p><strong>Client:</strong> {r.client.name}</p>
              <p><strong>Requested New Time:</strong> {new Date(r.requestedTime).toLocaleString()}</p>

              <button
                onClick={() => approve(r.id, r.requestedTime)}
                style={{ marginRight: "10px" }}
              >
                Approve
              </button>

              <button
                onClick={() => deny(r.id)}
                style={{ color: "red" }}
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
