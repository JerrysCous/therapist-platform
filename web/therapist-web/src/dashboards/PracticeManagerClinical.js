import { useEffect, useState } from "react";
import axios from "axios";

export default function PracticeManagerClinical() {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    axios
      .get("http://127.0.0.1:4000/practice-manager-clinical/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("CLINICAL DASHBOARD:", res.data);
        setTherapists(res.data.therapists || []); // ← SAFE
        setLoading(false);
      })
      .catch((err) => {
        console.error("Clinical dashboard error:", err.response?.data || err);
        setError("Failed to load clinical dashboard");
        setLoading(false);
      });
  }, []);

  if (loading) return <h2>Loading Clinical Dashboard...</h2>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Practice Manager Clinical Dashboard</h1>
      <h2>Therapists & Interns</h2>

      {therapists.length === 0 ? (
        <p>No therapists found.</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: "600px" }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
            </tr>
          </thead>
          <tbody>
            {therapists.map((t) => (
              <tr key={t.id}>
                <td style={td}>{t.id}</td>
                <td style={td}>{t.name}</td>
                <td style={td}>{t.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "left",
  background: "#eee",
};

const td = {
  border: "1px solid #ccc",
  padding: "8px",
};
