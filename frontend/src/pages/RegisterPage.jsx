import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", { email, password });
      navigate("/dashboard");
    } catch (err) {
      setError("Errore in registrazione");
    }
  };

  return (
    <div className="grid two" style={{ alignItems: "center" }}>
      <div>
        <h1>Registrati</h1>
        <p>Crea un account per iniziare.</p>
      </div>
      <form className="card" onSubmit={submit}>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button type="submit">Registrati</button>
          <small>
            Hai già un account? <Link to="/login">Accedi</Link>
          </small>
        </div>
      </form>
    </div>
  );
}
