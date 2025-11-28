import { useId, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const palette = [
  { value: "#2563eb", label: "Blu" },
  { value: "#22c55e", label: "Verde" },
  { value: "#f59e0b", label: "Oro" },
  { value: "#f97316", label: "Arancio" },
  { value: "#a855f7", label: "Viola" },
  { value: "#14b8a6", label: "Turchese" },
  { value: "#f43f5e", label: "Corallo" },
];

const formatNumber = (value) => {
  if (typeof value !== "number") return value;
  const abs = Math.abs(value);
  const opts = abs < 1 ? { maximumFractionDigits: 4 } : { maximumFractionDigits: 2 };
  return new Intl.NumberFormat("it-IT", opts).format(value);
};

const formatLabelShort = (label) => {
  if (typeof label !== "string") return label;
  return label.length > 14 ? `${label.slice(0, 14)}…` : label;
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__title">{label}</div>
      {payload.map((item) => (
        <div key={item.dataKey} className="chart-tooltip__row">
          <span>{item.name || item.dataKey}</span>
          <strong>{formatNumber(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function ChartPanel({ data = [], chartType = "bar" }) {
  if (!data.length) return <p>Nessun dato disponibile.</p>;

  const numericKeys = useMemo(
    () => Object.keys(data[0] || {}).filter((k) => typeof data[0][k] === "number"),
    [data],
  );
  const allKeys = Object.keys(data[0] || {});
  const fallbackValueKey = allKeys[1] || allKeys[0] || "valore";
  const valueKey = numericKeys[1] || numericKeys[0] || fallbackValueKey;
  const xKey =
    allKeys.find((k) => k !== valueKey && typeof data[0]?.[k] !== "number") ||
    allKeys.find((k) => k !== valueKey) ||
    allKeys[0] ||
    "label";

  const [color, setColor] = useState(palette[0].value);
  const chartId = useId();

  const layout = useMemo(() => {
    const labels = data.map((d) => String(d[xKey] ?? ""));
    const longest = labels.reduce((m, l) => Math.max(m, l.length), 0);
    const manyCategories = data.length > 8;
    const longLabels = longest > 12;
    return manyCategories || longLabels ? "vertical" : "horizontal";
  }, [data, xKey]);

  const stats = useMemo(() => {
    const values = data
      .map((d) => (typeof d[valueKey] === "number" ? d[valueKey] : null))
      .filter((v) => v !== null);
    if (!values.length) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { min, max, avg };
  }, [data, valueKey]);

  const renderChart = () => {
    const commonAxes = {
      data: data,
      margin: { top: 10, right: 20, left: 0, bottom: 10 },
    };

    if (chartType === "line") {
      return (
        <LineChart {...commonAxes}>
          <defs>
            <linearGradient id={`stroke-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.95} />
              <stop offset="100%" stopColor={color} stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey={xKey}
            type="category"
            scale="band"
            tickLine={false}
            tick={{ fontSize: 11, fill: "#475569" }}
            tickFormatter={(v) => formatLabelShort(String(v))}
            interval={0}
          />
          <YAxis tickFormatter={formatNumber} tickLine={false} tick={{ fontSize: 11, fill: "#475569" }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <ReferenceLine y={0} stroke="#cbd5e1" />
          {stats && (
            <ReferenceLine
              y={stats.avg}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{ position: "right", value: "Media", fill: "#475569", fontSize: 12 }}
            />
          )}
          <Line
            type="monotone"
            dataKey={valueKey}
            stroke={`url(#stroke-${chartId})`}
            strokeWidth={3}
            dot={{ r: 4, stroke: "#0f172a", strokeWidth: 1, fill: "#fff" }}
            activeDot={{ r: 6, strokeWidth: 0, fill: color }}
            name={valueKey}
          />
        </LineChart>
      );
    }

    const isVertical = layout === "vertical";
    return (
      <BarChart
        {...commonAxes}
        layout={isVertical ? "vertical" : "horizontal"}
        barCategoryGap="12%"
        barGap={4}
      >
        <defs>
          <linearGradient id={`fill-${chartId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.95} />
            <stop offset="100%" stopColor={color} stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        {isVertical ? (
          <>
            <XAxis type="number" tickFormatter={formatNumber} tickLine={false} tick={{ fontSize: 11, fill: "#475569" }} />
            <YAxis
              type="category"
              dataKey={xKey}
              tickLine={false}
              width={110}
              tick={{ fontSize: 11, fill: "#475569" }}
              tickFormatter={(v) => formatLabelShort(String(v))}
              scale="band"
            />
          </>
        ) : (
          <>
          <XAxis
            dataKey={xKey}
            type="category"
            scale="band"
            tickLine={false}
            tick={{ fontSize: 11, fill: "#475569" }}
            tickFormatter={(v) => formatLabelShort(String(v))}
            interval={0}
            padding={{ left: 4, right: 4 }}
          />
          <YAxis
            tickFormatter={formatNumber}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#475569" }}
          />
          </>
        )}
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <ReferenceLine y={0} stroke="#cbd5e1" />
        {stats && (
          <ReferenceLine
            y={stats.avg}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ position: "right", value: "Media", fill: "#475569", fontSize: 12 }}
          />
        )}
        <Bar dataKey={valueKey} fill={`url(#fill-${chartId})`} radius={[8, 8, 8, 8]} name={valueKey} />
      </BarChart>
    );
  };

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <div>
          <p className="chart-axes">
            Asse X: <strong>{xKey}</strong> · Valore: <strong>{valueKey}</strong>
          </p>
          {stats && (
            <p className="chart-stats">
              Min {formatNumber(stats.min)} · Media {formatNumber(stats.avg)} · Max {formatNumber(stats.max)}
            </p>
          )}
        </div>
        <label className="chart-color-picker">
          <span>Colore</span>
          <select
            value={color}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setColor(e.target.value)}
            className="chart-select"
            aria-label="Seleziona colore del grafico"
          >
            {palette.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>{renderChart()}</ResponsiveContainer>
      </div>
    </div>
  );
}
