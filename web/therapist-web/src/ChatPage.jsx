// ChatPage.jsx
import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:4000";

export default function ChatPage({ otherUserId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch messages between logged-in user and other user
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await axios.get(`${API_BASE}/messages/${otherUserId}`, {
          headers,
        });
        setMessages(res.data.messages);
      } catch (e) {
        console.error(e);
      }
    }
    loadMessages();

    // Optional: auto-refresh every 1 second for pseudo realtime
    const interval = setInterval(loadMessages, 1000);
    return () => clearInterval(interval);
  }, [otherUserId]);

  // Send new message
  async function sendMessage() {
    if (!text.trim()) return;

    await axios.post(
      `${API_BASE}/messages/send`,
      { receiverId: otherUserId, text },
      { headers }
    );

    setText("");
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Chat</h2>

      <div
        style={{
          border: "1px solid #ccc",
          height: "300px",
          padding: "10px",
          overflowY: "auto",
          marginBottom: "10px",
        }}
      >
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: "6px" }}>
            <strong>{m.senderId === otherUserId ? "Client" : "You"}:</strong>{" "}
            {m.text}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          style={{ flex: 1 }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

