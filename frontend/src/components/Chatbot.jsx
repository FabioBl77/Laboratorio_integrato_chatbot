import { useState } from "react";
import api from "../services/api";

const TABLE_CONTEXT_DEFAULT = [
  "`corso-dai.laboratorio_integrato.BusinessConnection Anagrafica Studenti`",
  "`corso-dai.laboratorio_integrato.BusinessConnection Corsi`",
  "`corso-dai.laboratorio_integrato.BusinessConnection Presenze`",
  "`corso-dai.laboratorio_integrato.BusinessConnection Staging Alunni Performance`",
  "`corso-dai.laboratorio_integrato.BusinessConnection Staging Anagrafica Alunni`",
  "`corso-dai.laboratorio_integrato.BusinessConnection Staging Anagrafica Candidati`",
  "`corso-dai.laboratorio_integrato.BusinessConnection Staging Cleaned Studenti Merged`",
  "`corso-dai.laboratorio_integrato.BusinessConnection Staging Errors`",
  "`corso-dai.laboratorio_integrato.BusinessConnection Staging Studenti`",
  "`corso-dai.laboratorio_integrato.BusinessConnection Staging Studenti Voti`",
  "`corso-dai.laboratorio_integrato.BusinessConnection Voti`",
].join("\n");

export default function Chatbot({ requests = [] }) {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableContext, setTableContext] = useState(TABLE_CONTEXT_DEFAULT);

  const buildTableContext = () => {
    const lines =
      requests
        ?.map((r) => `${r.prompt} -> ${r.sql_text || ""}`)
        .filter(Boolean) || [];
    return lines.join("\n");
  };

  const send = async () => {
    if (!prompt) return;
    const updated = [...history, { role: "user", content: prompt }];
    setHistory(updated);
    setLoading(true);
    try {
      const context = tableContext.trim() || buildTableContext();
      const { data } = await api.post("/chat", { prompt, history: updated, table_context: context });
      setHistory([...updated, { role: "assistant", content: data.reply }]);
      setPrompt("");
    } catch (err) {
      setHistory([...updated, { role: "assistant", content: "Errore nel chatbot" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Chatbot Groq (richiesta di query SQL)</h3>
      <div className="chat-box">
        {history.map((m, idx) => (
          <div key={idx} style={{ marginBottom: "0.5rem" }}>
            <strong>{m.role === "user" ? "Tu" : "Groq"}:</strong> {m.content}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
        <input
          className="input"
          placeholder="Richiedi la query SQL..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button onClick={send} disabled={loading}>
          {loading ? "..." : "Invia"}
        </button>
      </div>
      <textarea
        className="input"
        style={{ marginTop: "0.75rem", minHeight: "110px" }}
        placeholder="Context tabelle (es: Tabella A: ..., Tabella B: ...). Se vuoto usa lo storico delle query."
        value={tableContext}
        onChange={(e) => setTableContext(e.target.value)}
      />
    </div>
  );
}
