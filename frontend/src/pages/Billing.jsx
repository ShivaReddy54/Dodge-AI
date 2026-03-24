import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../api.js";

export default function Billing() {
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams();
      if (q.trim()) qs.set("q", q.trim());
      getJson(`/api/billing?${qs}`)
        .then(setList)
        .catch((e) => setErr(e.message));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <h2>Billing documents</h2>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search billing doc or customer…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {err && <p className="err">{err}</p>}
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Net</th>
              <th>Cancelled</th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.billingDocument}>
                <td>
                  <Link to={`/billing/${b.billingDocument}`}>
                    {b.billingDocument}
                  </Link>
                </td>
                <td>{b.billingDocumentType}</td>
                <td>{b.billingDocumentDate?.slice(0, 10)}</td>
                <td>{b.soldToParty}</td>
                <td>
                  {b.totalNetAmount} {b.transactionCurrency}
                </td>
                <td>{b.billingDocumentIsCancelled ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
