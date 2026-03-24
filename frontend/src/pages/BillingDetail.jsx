import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJson } from "../api.js";

export default function BillingDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getJson(`/api/billing/${id}`)
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <p className="err">{err}</p>;
  if (!data) return <p className="loading">Loading…</p>;

  const { header, items, customer } = data;

  return (
    <div>
      <p className="muted">
        <Link to="/billing">← Billing</Link>
      </p>
      <h2>Billing {header.billingDocument}</h2>
      <div className="card">
        <dl className="detail">
          <dt>Customer</dt>
          <dd>
            <Link to={`/customers/${header.soldToParty}`}>
              {header.soldToParty}
            </Link>
            {customer && ` — ${customer.businessPartnerName}`}
          </dd>
          <dt>Accounting document</dt>
          <dd>
            {header.accountingDocument} / FY {header.fiscalYear}
          </dd>
          <dt>Net amount</dt>
          <dd>
            {header.totalNetAmount} {header.transactionCurrency}
          </dd>
          <dt>Cancelled</dt>
          <dd>{header.billingDocumentIsCancelled ? "Yes" : "No"}</dd>
        </dl>
      </div>
      <h3>Items</h3>
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Material</th>
              <th>Qty</th>
              <th>Net</th>
              <th>Ref. delivery</th>
              <th>Ref. item</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.billingDocumentItem}>
                <td>{i.billingDocumentItem}</td>
                <td>{i.material}</td>
                <td>
                  {i.billingQuantity} {i.billingQuantityUnit}
                </td>
                <td>
                  {i.netAmount} {i.transactionCurrency}
                </td>
                <td>
                  {i.referenceSdDocument ? (
                    <Link to={`/deliveries/${i.referenceSdDocument}`}>
                      {i.referenceSdDocument}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{i.referenceSdDocumentItem}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
