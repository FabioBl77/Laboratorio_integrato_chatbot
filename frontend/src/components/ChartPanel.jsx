import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function ChartPanel({ data = [], chartType = "bar" }) {
  if (!data.length) return <p>Nessun dato disponibile.</p>;
  const keys = Object.keys(data[0] || {}).filter((k) => typeof data[0][k] === "number");
  const valueKey = keys[1] || keys[0];
  const xKey = keys[0] || "label";

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        {chartType === "line" ? (
          <LineChart data={data}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={valueKey} stroke="#2563eb" />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={valueKey} fill="#22c55e" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
