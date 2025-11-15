import { useEffect, useState } from "react";
import axios from "axios";

export default function ClientRequestAppointment() {
  const [therapist, setTherapist] = useState(null);
  const [availability, setAvailability] = useState([]); // used now
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Load assigned therapist
    axios
      .get("http://127.0.0.1:4000/client/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.therapist) {
          setTherapist(res.data.therapist);

          // Load therapist availability
          axios
            .get("http://127.0.0.1:4000/therapist/availability/" + res.data.therapist.id, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((res2) => {
              setAvailability(res2.data.slots || []);
            });
        }
      })
      .catch((err) => {
        console.error("ClientRequestAppointment load error:", err);
      });
  }, []);

  const handleRequest = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return;

    const finalTime = `${selectedDate}T${selectedTime}:00`;

    try {
      await axios.post(
        "http://127.0.0.1:4000/appointments/request",
        {
          therapistId: therapist.id,
          time: finalTime,
          reason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Appointment request sent!");
      setReason("");
      setSelectedDate("");
      setSelectedTime("");
    } catch (err) {
      console.error("Appointment request error:", err);
      alert(err.response?.data?.error || "Failed to request appointment");
    }
  };

  return (
    <div style={{ padding: "15px", border: "1px solid #ccc", borderRadius: 6 }}>
      <h3>Request Appointment</h3>

      {!therapist ? (
        <p>You must be assigned to a therapist to request appointments.</p>
      ) : (
        <form onSubmit={handleRequest}>
          <p>
            Request an appointment with <strong>{therapist.name}</strong>
          </p>

          {/* ---------- AVAILABILITY PREVIEW ---------- */}
          {availability.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <h4>Available Times:</h4>
              <ul>
                {availability.map((slot) => (
                  <li key={slot.id}>
                    {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][slot.weekday]}
                    {" — "}
                    {slot.startTime} to {slot.endTime}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <label>Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            required
          />

          <label>Time:</label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            required
          />

          <label>Reason (optional):</label>
          <input
            type="text"
            placeholder="Optional description"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <button type="submit" style={{ marginTop: 10 }}>
            Submit Request
          </button>
        </form>
      )}
    </div>
  );
}
