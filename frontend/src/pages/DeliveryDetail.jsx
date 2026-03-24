import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJson } from "../api.js";

export default function DeliveryDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getJson(`/api/deliveries/${id}`)
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <p className="err">{err}</p>;
  if (!data) return <p className="loading">Loading…</p>;

  const { header, items } = data;

  return (
    <div>
      <p className="muted">
        <Link to="/deliveries">← Deliveries</Link>
      </p>
      <h2>Delivery {header.deliveryDocument}</h2>
      <div className="card">
        <dl className="detail">
          <dt>Shipping point</dt>
          <dd>{header.shippingPoint}</dd>
          <dt>Created</dt>
          <dd>{header.creationDate?.slice(0, 10)}</dd>
          <dt>Goods movement status</dt>
          <dd>{header.overallGoodsMovementStatus}</dd>
        </dl>
      </div>
      <h3>Items</h3>
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Plant</th>
              <th>Sloc</th>
              <th>Qty</th>
              <th>Ref. sales order</th>
              <th>Ref. item</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.deliveryDocumentItem}>
                <td>{i.deliveryDocumentItem}</td>
                <td>{i.plant}</td>
                <td>{i.storageLocation}</td>
                <td>
                  {i.actualDeliveryQuantity} {i.deliveryQuantityUnit}
                </td>
                <td>
                  {i.referenceSdDocument ? (
                    <Link to={`/sales-orders/${i.referenceSdDocument}`}>
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
