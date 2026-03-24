import { useEffect, useState } from "react";
import { getJson } from "../api.js";

export default function Products() {
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams();
      if (q.trim()) qs.set("q", q.trim());
      getJson(`/api/products?${qs}`)
        .then(setList)
        .catch((e) => setErr(e.message));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <h2>Products</h2>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search product, old ID, description"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {err && <p className="err">{err}</p>}
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Old ID</th>
              <th>Type</th>
              <th>Group</th>
              <th>Description (EN)</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.product}>
                <td>{p.product}</td>
                <td>{p.productOldId}</td>
                <td>{p.productType}</td>
                <td>{p.productGroup}</td>
                <td>{p.productDescription}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
