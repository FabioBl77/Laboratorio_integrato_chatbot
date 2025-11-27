import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import ChartPanel from "../components/ChartPanel";

export default function RequestDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get(`/queries/${id}`);
        setItem(data);
      } catch (err) {
        setItem(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <p>Caricamento...</p>;
  if (!item) return <p>Richiesta non trovata.</p>;

  return (
    <div className="grid" style={{ gap: "1rem" }}>
      <div className="card">
        <h2>{item.prompt}</h2>
        <p style={{ color: "#475569", marginBottom: "0.5rem" }}>SQL generata:</p>
        <div className="sql-block">{item.sql_text || "Nessuna SQL disponibile"}</div>
      </div>
      <div className="card">
        <h3>Grafico</h3>
        <ChartPanel data={item.preview || []} chartType={item.chart_type} />
      </div>
      <div className="card">
        <h3>Tabella dati</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {(item.preview?.[0] ? Object.keys(item.preview[0]) : []).map((k) => (
                <th key={k} style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #e2e8f0" }}>
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {item.preview?.map((row, idx) => (
              <tr key={idx}>
                {Object.keys(row).map((k) => (
                  <td key={k} style={{ padding: "0.5rem", borderBottom: "1px solid #e2e8f0" }}>
                    {String(row[k])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h3>Report Groq</h3>
        <p>{item.report}</p>
      </div>
    </div>
  );
}
