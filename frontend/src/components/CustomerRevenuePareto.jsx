import { useEffect, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getJson } from "../api.js";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const amount = payload.find((p) => p.dataKey === "amount");
  const pct = payload.find((p) => p.dataKey === "cumulativePct");
  return (
    <div
      style={{
        background: "#1a2332",
        border: "1px solid #2d3a4d",
        borderRadius: 6,
        padding: "8px 10px",
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {amount && (
        <div style={{ color: "#8b9cb3" }}>
          Net amount:{" "}
          <span style={{ color: "#e7ecf3" }}>{amount.value?.toLocaleString()}</span>
        </div>
      )}
      {pct && (
        <div style={{ color: "#8b9cb3" }}>
          Cumulative:{" "}
          <span style={{ color: "#3d8bfd" }}>{pct.value}%</span>
        </div>
      )}
    </div>
  );
}

export default function CustomerRevenuePareto() {
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (applied.trim()) qs.set("query", applied.trim());
    getJson(`/api/analytics/customer-revenue-pareto?${qs}`)
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [applied]);

  return (
    <div className="card chart-card">
      <h3>Customer revenue (Pareto)</h3>
      <p className="muted" style={{ marginTop: 0 }}>
        Top sold-to parties by sum of sales order net amount (same layout as task:
        bar totals + cumulative % line). Filter narrows which orders are included.
      </p>
      <div className="query-row">
        <label className="muted" htmlFor="pareto-query">
          Query
        </label>
        <input
          id="pareto-query"
          type="search"
          placeholder="Customer name or ID (optional)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setApplied(query)}
        />
        <button
          type="button"
          className="btn-apply"
          onClick={() => setApplied(query)}
        >
          Run
        </button>
      </div>
      {err && <p className="err">{err}</p>}
      {!data && !err && <p className="loading">Loading chart…</p>}
      {data && data.series?.length === 0 && (
        <p className="muted">No sales orders match this query.</p>
      )}
      {data && data.series?.length > 0 && (
        <>
          <p className="muted chart-meta">
            {data.orderCount} orders · {data.customerCount} customers · total{" "}
            {data.totalAmount?.toLocaleString()} {data.currency}
          </p>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data.series}
                margin={{ top: 8, right: 12, left: 4, bottom: 48 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4d" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#8b9cb3", fontSize: 11 }}
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#8b9cb3", fontSize: 11 }}
                  label={{
                    value: `Amount (${data.currency})`,
                    angle: -90,
                    position: "insideLeft",
                    fill: "#8b9cb3",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fill: "#8b9cb3", fontSize: 11 }}
                  label={{
                    value: "Cumulative %",
                    angle: 90,
                    position: "insideRight",
                    fill: "#8b9cb3",
                    fontSize: 11,
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
                <Bar
                  yAxisId="left"
                  dataKey="amount"
                  name="Net amount"
                  fill="#3d8bfd"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativePct"
                  name="Cumulative %"
                  stroke="#e7a84a"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#e7a84a" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
