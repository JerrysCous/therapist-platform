import { useEffect, useState } from "react";
import axios from "axios";

export default function TherapistAvailability() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const [day, setDay] = useState(1);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get("http://127.0.0.1:4000/availability/my", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSlots(res.data.slots || []);
      setLoading(false);
    } catch (err) {
      console.error("load availability error:", err);
      setLoading(false);
    }
  };

  const addSlot = () => {
    setSlots((prev) => [
      ...prev,
      { weekday: parseInt(day), startTime: start, endTime: end }
    ]);
  };

  const removeSlot = (index) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const saveSlots = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.post(
        "http://127.0.0.1:4000/availability/set",
        { slots },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Availability saved!");
      loadAvailability();
    } catch (err) {
      console.error("save slots error:", err);
      alert("Failed to save.");
    }
  };

  if (loading) return <h2>Loading availability...</h2>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Manage Availability</h1>

      {/* CURRENT SLOTS */}
      <h2>Current Schedule</h2>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Day</th>
            <th>Start</th>
            <th>End</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot, i) => (
            <tr key={i}>
              <td>{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][slot.weekday]}</td>
              <td>{slot.startTime}</td>
              <td>{slot.endTime}</td>
              <td><button onClick={() => removeSlot(i)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Add New Slot</h2>

      <select value={day} onChange={(e) => setDay(e.target.value)}>
        <option value="0">Sunday</option>
        <option value="1">Monday</option>
        <option value="2">Tuesday</option>
        <option value="3">Wednesday</option>
        <option value="4">Thursday</option>
        <option value="5">Friday</option>
        <option value="6">Saturday</option>
      </select>

      <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
      <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />

      <button onClick={addSlot}>Add Slot</button>
      <button onClick={saveSlots} style={{ marginLeft: 10 }}>Save All</button>
    </div>
  );
}

