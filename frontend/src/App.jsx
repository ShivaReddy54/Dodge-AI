import { NavLink, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import SalesOrders from "./pages/SalesOrders.jsx";
import SalesOrderDetail from "./pages/SalesOrderDetail.jsx";
import Customers from "./pages/Customers.jsx";
import CustomerDetail from "./pages/CustomerDetail.jsx";
import Products from "./pages/Products.jsx";
import Billing from "./pages/Billing.jsx";
import BillingDetail from "./pages/BillingDetail.jsx";
import Deliveries from "./pages/Deliveries.jsx";
import DeliveryDetail from "./pages/DeliveryDetail.jsx";
import Payments from "./pages/Payments.jsx";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => (isActive ? "active" : undefined)}
      end={to === "/"}
    >
      {children}
    </NavLink>
  );
}

export default function App() {
  return (
    <div className="layout">
      <header>
        <h1>SAP Order-to-Cash Explorer</h1>
        <nav>
          <NavItem to="/">Dashboard</NavItem>
          <NavItem to="/sales-orders">Sales orders</NavItem>
          <NavItem to="/customers">Customers</NavItem>
          <NavItem to="/products">Products</NavItem>
          <NavItem to="/billing">Billing</NavItem>
          <NavItem to="/deliveries">Deliveries</NavItem>
          <NavItem to="/payments">AR payments</NavItem>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sales-orders" element={<SalesOrders />} />
          <Route path="/sales-orders/:id" element={<SalesOrderDetail />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/products" element={<Products />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/billing/:id" element={<BillingDetail />} />
          <Route path="/deliveries" element={<Deliveries />} />
          <Route path="/deliveries/:id" element={<DeliveryDetail />} />
          <Route path="/payments" element={<Payments />} />
        </Routes>
      </main>
    </div>
  );
}
