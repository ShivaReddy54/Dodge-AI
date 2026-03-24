import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJson } from "../api.js";

export default function SalesOrderDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getJson(`/api/sales-orders/${id}`)
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <p className="err">{err}</p>;
  if (!data) return <p className="loading">Loading…</p>;

  const { header, customer, items, schedules } = data;

  return (
    <div>
      <p className="muted">
        <Link to="/sales-orders">← Sales orders</Link>
      </p>
      <h2>Order {header.salesOrder}</h2>
      <div className="card">
        <dl className="detail">
          <dt>Sold-to party</dt>
          <dd>
            <Link to={`/customers/${header.soldToParty}`}>
              {header.soldToParty}
            </Link>
            {customer && ` — ${customer.businessPartnerName}`}
          </dd>
          <dt>Org / channel</dt>
          <dd>
            {header.salesOrganization} / {header.distributionChannel} /{" "}
            {header.organizationDivision}
          </dd>
          <dt>Net amount</dt>
          <dd>
            {header.totalNetAmount} {header.transactionCurrency}
          </dd>
          <dt>Incoterms</dt>
          <dd>
            {header.incotermsClassification} {header.incotermsLocation1}
          </dd>
          <dt>Requested delivery</dt>
          <dd>{header.requestedDeliveryDate?.slice(0, 10)}</dd>
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
              <th>Unit</th>
              <th>Net</th>
              <th>Plant</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.salesOrderItem}>
                <td>{i.salesOrderItem}</td>
                <td>{i.material}</td>
                <td>{i.requestedQuantity}</td>
                <td>{i.requestedQuantityUnit}</td>
                <td>{i.netAmount}</td>
                <td>{i.productionPlant}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {schedules.length > 0 && (
        <>
          <h3>Schedule lines</h3>
          <div className="card" style={{ padding: 0, overflow: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Line</th>
                  <th>Confirmed delivery</th>
                  <th>Confirmed qty</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr
                    key={`${s.salesOrderItem}-${s.scheduleLine}`}
                  >
                    <td>{s.salesOrderItem}</td>
                    <td>{s.scheduleLine}</td>
                    <td>{s.confirmedDeliveryDate?.slice(0, 10)}</td>
                    <td>
                      {s.confdOrderQtyByMatlAvailCheck} {s.orderQuantityUnit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
