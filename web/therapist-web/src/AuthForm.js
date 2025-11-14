import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AuthForm() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [role, setRole] = useState("CLIENT"); // DEFAULT
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const redirectByRole = (role) => {
    if (role === "OWNER") return navigate("/owner-dashboard");
    if (role === "PRACTICE_MANAGER_ADMIN")
      return navigate("/practice-manager-admin");
    if (role === "PRACTICE_MANAGER_CLINICAL")
      return navigate("/practice-manager-clinical");
    if (role === "THERAPIST") return navigate("/therapist-dashboard");
    if (role === "INTERN") return navigate("/intern-dashboard");
    if (role === "CLIENT") return navigate("/client-dashboard");

    navigate("/client-dashboard");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    axios
      .post("http://127.0.0.1:4000/login", { email, password })
      .then((res) => {
        localStorage.setItem("token", res.data.token);

        redirectByRole(res.data.user.role);
      })
      .catch(() => setError("Invalid email or password"));
  };

  const handleRegister = (e) => {
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
        redirectByRole(res.data.user.role);
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

      {/* LOGIN */}
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

      {/* REGISTER */}
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
            <option value="CLIENT">Client</option>
            <option value="THERAPIST">Therapist</option>
            <option value="INTERN">Intern</option>
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
