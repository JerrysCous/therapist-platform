import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import AvailabilityForm from "./AvailabilityForm";
import { Link } from "react-router-dom";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function TherapistDashboard() {
  const [profile, setProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const loadAvailability = useCallback(async () => {
    try {
      const res = await axios.get("http://127.0.0.1:4000/availability/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const unique = res.data.slots
        .filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i)
        .sort(
          (a, b) =>
            a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)
        );

      setAvailability(unique);
    } catch (err) {
      console.error("Error loading availability:", err.response?.data || err);
    }
  }, [token]);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await axios.get("http://127.0.0.1:4000/therapist/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile(res.data.profile);
      setClients(res.data.clients || []);
      setAppointments(res.data.appointments || []);
      setLoading(false);
    } catch (err) {
      console.error("Therapist dashboard error:", err.response?.data || err);
      window.location.href = "/";
    }
  }, [token]);

  useEffect(() => {
    if (!token) return (window.location.href = "/");

    loadDashboard();
    loadAvailability();
  }, [token, loadDashboard, loadAvailability]);

  const deleteSlot = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:4000/availability/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAvailability((prev) => prev.filter((slot) => slot.id !== id));
    } catch (err) {
      console.error("Delete slot error:", err.response?.data || err);
      alert("Failed to delete slot.");
    }
  };

  const markAsCompleted = async (id) => {
    try {
      await axios.post(
        `http://127.0.0.1:4000/appointments/${id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === id ? { ...appt, status: "COMPLETED" } : appt
        )
      );
    } catch (err) {
      console.error("Mark completed error:", err.response?.data || err);
      alert("Failed to mark appointment as completed.");
    }
  };

  if (loading) return <h2 style={{ padding: "20px" }}>Loading Therapist Dashboard...</h2>;

  // -------------------------
  // Styles
  // -------------------------

  const card = {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    marginBottom: "25px",
  };

  const sectionTitle = {
    marginBottom: "12px",
    borderBottom: "1px solid #ddd",
    paddingBottom: "6px",
    fontSize: "20px",
    fontWeight: "600",
  };

  const navButton = {
    marginRight: "10px",
    padding: "10px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    background: "#4F46E5",
    color: "white",
    fontWeight: "bold",
  };

  const smallButton = {
    padding: "5px 10px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
  };

  return (
    <div style={{ padding: "25px", maxWidth: "900px", margin: "auto" }}>
      <h1 style={{ marginBottom: "20px", fontSize: "28px" }}>
        Therapist Dashboard
      </h1>

      {/* NAVIGATION BAR */}
      <div style={{ marginBottom: "25px", display: "flex", flexWrap: "wrap" }}>
        <Link to="/therapist/availability">
          <button style={navButton}>Availability</button>
        </Link>

        <Link to="/appointments/pending">
          <button style={navButton}>Pending Requests</button>
        </Link>

        <Link to="/therapist/reschedule-requests">
          <button style={navButton}>Reschedule Requests</button>
        </Link>

        <Link to="/therapist/reschedule-direct">
          <button style={navButton}>Direct Reschedule</button>
        </Link>

        <Link to="/completed-appointments">
          <button style={navButton}>Completed Sessions</button>
        </Link>
      </div>

      {/* PROFILE */}
      <div style={card}>
        <div style={sectionTitle}>Profile</div>
        <p><strong>Bio:</strong> {profile?.bio || "No bio provided"}</p>
        <p><strong>Specialization:</strong> {profile?.specialization || "None"}</p>
      </div>

      {/* AVAILABILITY */}
      <div style={card}>
        <div style={sectionTitle}>Availability</div>

        <AvailabilityForm onUpdated={loadAvailability} />

        <ul style={{ marginTop: "15px" }}>
          {availability.length === 0 && <li>No availability set</li>}
          {availability.map((slot) => (
            <li key={slot.id} style={{ marginBottom: "6px" }}>
              <strong>{WEEKDAYS[slot.weekday]}:</strong>{" "}
              {slot.startTime} – {slot.endTime}
              <button
                onClick={() => deleteSlot(slot.id)}
                style={{
                  ...smallButton,
                  marginLeft: "10px",
                  background: "#DC2626",
                  color: "white",
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* CLIENT LIST */}
      <div style={card}>
        <div style={sectionTitle}>Clients</div>

        <ul>
          {clients.length === 0 ? (
            <li>No clients linked</li>
          ) : (
            clients.map((c) => (
              <li key={c.id}>
                {c.name} ({c.email})
              </li>
            ))
          )}
        </ul>
      </div>

      {/* APPOINTMENTS */}
      <div style={card}>
        <div style={sectionTitle}>Appointments</div>

        <ul>
          {appointments.length === 0 ? (
            <li>No appointments scheduled</li>
          ) : (
            appointments.map((appt) => (
              <li
                key={appt.id}
                style={{
                  marginBottom: "12px",
                  padding: "10px",
                  background: "#f9fafb",
                  borderRadius: "8px",
                }}
              >
                <strong>{appt.client?.name}</strong> —{" "}
                {new Date(appt.time).toLocaleString()}{" "}
                <span style={{ fontStyle: "italic" }}>({appt.status})</span>
                {appt.status === "CONFIRMED" && (
                  <button
                    onClick={() => markAsCompleted(appt.id)}
                    style={{
                      ...smallButton,
                      marginLeft: "10px",
                      background: "#16A34A",
                      color: "white",
                    }}
                  >
                    Mark Completed
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
