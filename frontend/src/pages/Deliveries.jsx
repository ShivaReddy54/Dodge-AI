import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../api.js";

export default function Deliveries() {
  const [list, setList] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getJson("/api/deliveries")
      .then(setList)
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="err">{err}</p>;

  return (
    <div>
      <h2>Outbound deliveries</h2>
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Delivery</th>
              <th>Created</th>
              <th>Shipping point</th>
              <th>Goods movement</th>
              <th>Picking</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.deliveryDocument}>
                <td>
                  <Link to={`/deliveries/${d.deliveryDocument}`}>
                    {d.deliveryDocument}
                  </Link>
                </td>
                <td>{d.creationDate?.slice(0, 10)}</td>
                <td>{d.shippingPoint}</td>
                <td>{d.overallGoodsMovementStatus}</td>
                <td>{d.overallPickingStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
