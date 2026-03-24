import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJson } from "../api.js";

export default function CustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getJson(`/api/customers/${id}`)
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <p className="err">{err}</p>;
  if (!data) return <p className="loading">Loading</p>;

  const { partner, addresses, company, salesAreas } = data;

  return (
    <div>
      <p className="muted">
        <Link to="/customers">Back to customers</Link>
      </p>
      <h2>{partner.businessPartnerName}</h2>
      <p className="muted">ID: {partner.businessPartner}</p>
      <div className="card">
        <dl className="detail">
          <dt>Category</dt>
          <dd>{partner.businessPartnerCategory}</dd>
          <dt>Grouping</dt>
          <dd>{partner.businessPartnerGrouping}</dd>
          <dt>Blocked</dt>
          <dd>{partner.businessPartnerIsBlocked ? "Yes" : "No"}</dd>
        </dl>
      </div>
      {addresses.length > 0 && (
        <>
          <h3>Addresses</h3>
          {addresses.map((a) => (
            <div key={a.addressId} className="card">
              <p>
                {a.streetName}, {a.cityName} {a.postalCode}, {a.region}{" "}
                {a.country}
              </p>
            </div>
          ))}
        </>
      )}
      {company.length > 0 && (
        <>
          <h3>Company assignment</h3>
          <div className="card" style={{ padding: 0, overflow: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Recon account</th>
                </tr>
              </thead>
              <tbody>
                {company.map((c) => (
                  <tr key={c.companyCode}>
                    <td>{c.companyCode}</td>
                    <td>{c.reconciliationAccount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {salesAreas.length > 0 && (
        <>
          <h3>Sales areas</h3>
          <div className="card" style={{ padding: 0, overflow: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Org</th>
                  <th>Channel</th>
                  <th>Div</th>
                  <th>Currency</th>
                  <th>Incoterms</th>
                </tr>
              </thead>
              <tbody>
                {salesAreas.map((s) => (
                  <tr
                    key={`${s.salesOrganization}-${s.distributionChannel}-${s.division}`}
                  >
                    <td>{s.salesOrganization}</td>
                    <td>{s.distributionChannel}</td>
                    <td>{s.division}</td>
                    <td>{s.currency}</td>
                    <td>
                      {s.incotermsClassification} {s.incotermsLocation1}
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
