import { useEffect, useState } from "react";
import axios from "axios";

export default function PracticeManagerClinical() {
  const [data, setData] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:4000/practice-manager-clinical/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setData(res.data))
      .catch(() => alert("Error loading dashboard"));
  }, []);

  if (!data) return <h2>Loading Clinical Manager Dashboard...</h2>;

  const { therapists, interns, clients, upcomingAppointments, allAppointments } = data;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1>Clinical Manager Dashboard</h1>

      <hr />

      <h2>Therapists</h2>
      <ul>
        {therapists.map((t) => (
          <li key={t.id}>
            {t.name} ({t.email})
          </li>
        ))}
      </ul>

      <hr />

      <h2>Interns</h2>
      <ul>
        {interns.map((i) => (
          <li key={i.id}>
            {i.name} ({i.email})
          </li>
        ))}
      </ul>

      <hr />

      <h2>Clients</h2>
      <ul>
        {clients.map((c) => (
          <li key={c.id}>
            {c.name} ({c.email})
          </li>
        ))}
      </ul>

      <hr />

      <h2>Upcoming Appointments</h2>
      {upcomingAppointments.length === 0 ? (
        <p>No upcoming appointments</p>
      ) : (
        <ul>
          {upcomingAppointments.map((a) => (
            <li key={a.id}>
              {new Date(a.time).toLocaleString()} — Therapist: {a.therapist.name}, Client: {a.client.name}
            </li>
          ))}
        </ul>
      )}

      <hr />

      <h2>All Appointments</h2>
      {allAppointments.length === 0 ? (
        <p>No appointments in system</p>
      ) : (
        <ul>
          {allAppointments.map((a) => (
            <li key={a.id}>
              {new Date(a.time).toLocaleString()} — Therapist: {a.therapist.name}, Client: {a.client.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
