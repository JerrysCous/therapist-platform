import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import AvailabilityForm from "./AvailabilityForm";
import { Link } from "react-router-dom";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TherapistDashboard() {
  const [profile, setProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // -------------------------
  // FETCH AVAILABILITY
  // -------------------------
  const loadAvailability = useCallback(async () => {
    try {
      const res = await axios.get("http://127.0.0.1:4000/availability/my", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const unique = res.data.slots
        .filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i)
        .sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime));

      setAvailability(unique);
    } catch (err) {
      console.error("Error loading availability:", err.response?.data || err);
    }
  }, [token]);

  // -------------------------
  // INITIAL DASHBOARD LOAD
  // -------------------------
  useEffect(() => {
    if (!token) return (window.location.href = "/");

    axios
      .get("http://127.0.0.1:4000/therapist/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setProfile(res.data.profile);
        setClients(res.data.clients || []);
        setAppointments(res.data.appointments || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Therapist dashboard error:", err.response?.data || err);
        window.location.href = "/";
      });

    loadAvailability();
  }, [token, loadAvailability]);


  // -------------------------
  // DELETE SLOT
  // -------------------------
  const deleteSlot = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:4000/availability/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAvailability(prev => prev.filter(slot => slot.id !== id));
    } catch (err) {
      console.error("Delete slot error:", err.response?.data || err);
      alert("Failed to delete slot.");
    }
  };


  if (loading) return <h2>Loading Therapist Dashboard...</h2>;

  return (
  <div style={{ padding: "20px" }}>
    <h1>Therapist Dashboard</h1>

    {/* NAV BUTTONS */}
    <div style={{ marginBottom: "20px" }}>
      <Link to="/therapist/availability">
        <button style={{ marginRight: "10px" }}>
          Manage Availability
        </button>
      </Link>

      <Link to="/appointments/pending">
        <button>
          View Pending Appointment Requests
        </button>
      </Link>
    </div>

    {/* PROFILE */}
    <h2>Profile</h2>
    <p><strong>Bio:</strong> {profile?.bio || "No bio"}</p>
    <p><strong>Specialization:</strong> {profile?.specialization || "None"}</p>

    {/* AVAILABILITY SECTION */}
    <h2>Availability</h2>
    <AvailabilityForm onUpdated={loadAvailability} />

    <ul>
      {availability.length === 0 && <li>No availability set</li>}
      {availability.map((slot) => (
        <li key={slot.id}>
          <strong>{WEEKDAYS[slot.weekday]}:</strong> {slot.startTime} - {slot.endTime}
          <button
            onClick={() => deleteSlot(slot.id)}
            style={{
              marginLeft: "10px",
              background: "red",
              color: "white",
              border: "none",
              padding: "5px 8px",
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>

    {/* CLIENT LIST */}
    <h2>Clients</h2>
    <ul>
      {clients.length === 0 
        ? <li>No clients yet</li>
        : clients.map((c) => (
            <li key={c.id}>{c.name} ({c.email})</li>
          ))
      }
    </ul>

    {/* APPOINTMENTS */}
    <h2>Appointments</h2>
    <ul>
      {appointments.length === 0 
        ? <li>No appointments</li>
        : appointments.map((appt) => (
            <li key={appt.id}>
              {new Date(appt.time).toLocaleString()} — {appt.client?.name}
            </li>
          ))
      }
    </ul>

  </div>
);
}