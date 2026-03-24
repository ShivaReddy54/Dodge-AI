import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../api.js";

export default function Customers() {
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams();
      if (q.trim()) qs.set("q", q.trim());
      getJson(`/api/customers?${qs}`)
        .then(setList)
        .catch((e) => setErr(e.message));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <h2>Business partners (customers)</h2>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search ID or name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {err && <p className="err">{err}</p>}
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Partner</th>
              <th>Name</th>
              <th>Grouping</th>
              <th>Blocked</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.businessPartner}>
                <td>
                  <Link to={`/customers/${p.businessPartner}`}>
                    {p.businessPartner}
                  </Link>
                </td>
                <td>{p.businessPartnerName}</td>
                <td>{p.businessPartnerGrouping}</td>
                <td>{p.businessPartnerIsBlocked ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
