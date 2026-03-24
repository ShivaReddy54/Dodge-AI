import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../api.js";
import CustomerRevenuePareto from "../components/CustomerRevenuePareto.jsx";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getJson("/api/stats")
      .then(setStats)
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="err">{err}</p>;
  if (!stats) return <p className="loading">Loading…</p>;

  return (
    <div>
      <h2>Dataset overview</h2>
      <p className="muted">
        Loaded from <code>sap-o2c-data</code> (JSONL) into SQLite. Browse the
        order-to-cash chain: sales → delivery → billing → AR.
      </p>
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.entity} className="stat">
            <div className="n">{s.n}</div>
            <div className="label">{s.entity.replace(/_/g, " ")}</div>
          </div>
        ))}
      </div>
      <CustomerRevenuePareto />
      <h3>Quick links</h3>
      <ul className="muted">
        <li>
          <Link to="/sales-orders">Sales orders</Link>
        </li>
        <li>
          <Link to="/billing">Billing documents</Link>
        </li>
        <li>
          <Link to="/payments">Customer payments (AR)</Link>
        </li>
      </ul>
    </div>
  );
}
