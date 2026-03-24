import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../api.js";

export default function Payments() {
  const [list, setList] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getJson("/api/payments")
      .then(setList)
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="err">{err}</p>;

  return (
    <div>
      <h2>Payments (accounts receivable)</h2>
      <p className="muted">
        Clearing postings linked to customers (sample AR payments dataset).
      </p>
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Posting date</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>GL</th>
              <th>Clearing doc</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p, idx) => (
              <tr
                key={`${p.accountingDocument}-${p.accountingDocumentItem}-${idx}`}
              >
                <td>{p.postingDate?.slice(0, 10)}</td>
                <td>
                  <Link to={`/customers/${p.customer}`}>{p.customer}</Link>
                </td>
                <td>{p.amountInTransactionCurrency}</td>
                <td>{p.transactionCurrency}</td>
                <td>{p.glAccount}</td>
                <td>{p.clearingAccountingDocument}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
