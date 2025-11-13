import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AuthForm() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [role, setRole] = useState("USER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    axios
      .post("http://127.0.0.1:4000/login", { email, password })
      .then((res) => {
        localStorage.setItem("token", res.data.token);

        const role = res.data.user.role;

        if (role === "THERAPIST") navigate("/therapist-dashboard");
        else navigate("/client-dashboard");
      })
      .catch(() => setError("Invalid email or password"));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    axios
      .post("http://127.0.0.1:4000/signup", {
        name,
        email,
        password,
        role,
      })
      .then((res) => {
        localStorage.setItem("token", res.data.token);

        if (role === "THERAPIST") navigate("/therapist-dashboard");
        else navigate("/client-dashboard");
      })
      .catch((err) => {
        const msg = err.response?.data?.error || "Signup failed";
        setError(msg);
      });
  };

  return (
    <div style={{ maxWidth: 350, margin: "0 auto" }}>
      <h2>{mode === "login" ? "Login" : "Register"}</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {mode === "login" && (
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>
      )}

      {mode === "register" && (
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Full Name"
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <select onChange={(e) => setRole(e.target.value)}>
            <option value="USER">Client</option>
            <option value="THERAPIST">Therapist</option>
          </select>

          <button type="submit">Create Account</button>
        </form>
      )}

      <br />

      <p
        style={{ color: "blue", cursor: "pointer" }}
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login"
          ? "Need an account? Register"
          : "Already have an account? Login"}
      </p>
    </div>
  );
}
