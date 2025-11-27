import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ChartPanel from "../components/ChartPanel";
import Chatbot from "../components/Chatbot";

export default function DashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();
  const userId = 1; // demo: replace with real auth id

  const load = async () => {
    try {
      const { data } = await api.get("/queries", { params: { user_id: userId } });
      setRequests(data);
    } catch (err) {
      // keep silent in demo
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      await api.post("/queries", { prompt, user_id: userId });
      setPrompt("");
      load();
    } catch (err) {
      alert("Errore nella creazione della richiesta");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/queries/${id}`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert("Errore nell'eliminazione");
    } finally {
      setDeletingId(null);
    }
  };

  const deriveTitle = (req, idx = 0) => {
    // Prima prova a usare il prompt in forma abbreviata: più distintivo tra grafici
    if (req.prompt) {
      const trimmed = req.prompt.trim();
      if (trimmed) return trimmed.length > 60 ? `${trimmed.slice(0, 60)}...` : trimmed;
    }

    // Altrimenti prova a derivare dal testo SQL
    const sql = (req.sql_text || "").trim();
    const lower = sql.toLowerCase();

    const clean = (val) => (val || "").replace(/[`"[\]]/g, "").split(".").pop();
    const cap = (val) => (val ? val.charAt(0).toUpperCase() + val.slice(1) : "");

    const tableMatch = lower.match(/from\s+([`"\[\]\w\.]+)/);
    const groupMatch = lower.match(/group\s+by\s+([`"\[\]\w\.]+)/);
    const selectMatch = sql.match(/select\s+(.+?)\s+from/i);

    const table = tableMatch ? clean(tableMatch[1]) : "";
    const group = groupMatch ? clean(groupMatch[1]) : "";
    const firstField = selectMatch ? clean(selectMatch[1].split(",")[0]) : "";

    if (table && group) return `${cap(table)} per ${group}`;
    if (table && firstField && firstField !== "*") return `${cap(firstField)} da ${table}`;
    if (table) return cap(table);

    // Ultimo fallback: titolo numerato distinto
    return `Grafico #${idx + 1}`;
  };

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div className="card">
        <h2>Inserisci nuova richiesta SQL per generare il grafico</h2>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input
            className="input"
            placeholder="Inserisci la query SQL da generare..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button onClick={submit} disabled={loading}>
            {loading ? "..." : "Genera"}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Storico richieste</h3>
        <div className="grid two">
          {requests.map((r, idx) => (
            <div
              key={r.id}
              className="card"
              style={{ cursor: "pointer", position: "relative" }}
              onClick={() => navigate(`/requests/${r.id}`)}
            >
              <button
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  padding: "0.25rem 0.5rem",
                  background: "#ef4444",
                }}
                disabled={deletingId === r.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(r.id);
                }}
              >
                {deletingId === r.id ? "..." : "Elimina"}
              </button>
              <div className="card-title-scroll" title={r.prompt}>
                <strong>{deriveTitle(r, idx)}</strong>
              </div>
              <p style={{ color: "#475569" }}>Status: {r.status}</p>
              <ChartPanel data={r.result_preview || []} chartType={r.chart_type} />
            </div>
          ))}
          {!requests.length && <p>Nessuna richiesta ancora.</p>}
        </div>
      </div>

      <Chatbot requests={requests} />
    </div>
  );
}
