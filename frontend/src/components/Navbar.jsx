import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "12px",
            background: "linear-gradient(135deg, #22c55e, #2563eb)",
          }}
        />
        <strong>DataGroq</strong>
      </div>
      <nav style={{ display: "flex", gap: "1rem" }}>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/login">Logout</Link>
      </nav>
    </header>
  );
}
