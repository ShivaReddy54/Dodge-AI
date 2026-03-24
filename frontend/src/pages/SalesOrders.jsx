import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../api.js";

export default function SalesOrders() {
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams();
      if (q.trim()) qs.set("q", q.trim());
      getJson(`/api/sales-orders?${qs}`)
        .then(setList)
        .catch((e) => setErr(e.message));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <h2>Sales orders</h2>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search order or sold-to party…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {err && <p className="err">{err}</p>}
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Sold-to</th>
              <th>Created</th>
              <th>Net amount</th>
              <th>Currency</th>
              <th>Delivery status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((h) => (
              <tr key={h.salesOrder}>
                <td>
                  <Link to={`/sales-orders/${h.salesOrder}`}>{h.salesOrder}</Link>
                </td>
                <td>{h.soldToParty}</td>
                <td>{h.creationDate?.slice(0, 10)}</td>
                <td>{h.totalNetAmount}</td>
                <td>{h.transactionCurrency}</td>
                <td>{h.overallDeliveryStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
