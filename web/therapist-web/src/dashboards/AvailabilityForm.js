import { useEffect, useState } from "react";
import axios from "axios";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AvailabilityForm() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // form for *one* new slot
  const [newSlot, setNewSlot] = useState({
    weekday: 1,       // Monday
    startTime: "09:00",
    endTime: "17:00",
  });

  // Load existing availability from API
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    axios
      .get("http://127.0.0.1:4000/availability/my", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setSlots(res.data.slots || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Load availability error:", err.response?.data || err);
        setError("Failed to load availability");
        setLoading(false);
      });
  }, []);

  const handleAddSlot = () => {
    // basic guard
    if (!newSlot.startTime || !newSlot.endTime) return;

    setSlots((prev) => [
      ...prev,
      {
        weekday: Number(newSlot.weekday),
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
      },
    ]);
  };

  const handleRemoveSlot = (index) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        slots: slots.map((s) => ({
          weekday: Number(s.weekday),
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      };

      const res = await axios.post(
        "http://127.0.0.1:4000/availability/set",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Save availability response:", res.data);
      alert("Availability saved.");
    } catch (err) {
      console.error("Save availability error:", err.response?.data || err);
      setError(
        err.response?.data?.error || "Failed to save availability"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading availability…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  // sort by weekday then startTime for display
  const sortedSlots = [...slots].sort((a, b) => {
    if (a.weekday !== b.weekday) return a.weekday - b.weekday;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div style={{ marginBottom: "30px" }}>
      {/* CURRENT SCHEDULE */}
      <h3>Current Schedule</h3>
      {sortedSlots.length === 0 ? (
        <p>No availability set.</p>
      ) : (
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            maxWidth: "600px",
            marginBottom: "15px",
          }}
        >
          <thead>
            <tr>
              <th style={th}>Day</th>
              <th style={th}>Start</th>
              <th style={th}>End</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedSlots.map((slot, idx) => (
              <tr key={idx}>
                <td style={td}>{WEEKDAYS[slot.weekday]}</td>
                <td style={td}>{slot.startTime}</td>
                <td style={td}>{slot.endTime}</td>
                <td style={td}>
                  <button
                    onClick={() => handleRemoveSlot(idx)}
                    style={{
                      background: "#c00",
                      color: "#fff",
                      border: "none",
                      padding: "4px 8px",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ADD NEW SLOT */}
      <h3>Add New Availability</h3>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <select
          value={newSlot.weekday}
          onChange={(e) =>
            setNewSlot((prev) => ({
              ...prev,
              weekday: Number(e.target.value),
            }))
          }
        >
          {WEEKDAYS.map((name, idx) => (
            <option key={idx} value={idx}>
              {name}
            </option>
          ))}
        </select>

        <input
          type="time"
          value={newSlot.startTime}
          onChange={(e) =>
            setNewSlot((prev) => ({ ...prev, startTime: e.target.value }))
          }
        />

        <input
          type="time"
          value={newSlot.endTime}
          onChange={(e) =>
            setNewSlot((prev) => ({ ...prev, endTime: e.target.value }))
          }
        />

        <button onClick={handleAddSlot}>Add Slot</button>
        <button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Availability"}
        </button>
      </div>
    </div>
  );
}

const th = {
  border: "1px solid #ccc",
  padding: "6px",
  textAlign: "left",
  background: "#f5f5f5",
};

const td = {
  border: "1px solid #ccc",
  padding: "6px",
};

