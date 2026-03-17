import React, { useState } from "react";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("Dashboard");

  const menuItems = ["Dashboard", "Suppliers", "Buyers", "Inventory", "Reports", "Invoice"];

  if (!loggedIn) {
    return (
      <div style={loginWrapper}>
        <div style={loginBox}>
          <h2 style={{ color: "#d97706", textAlign: "center" }}>Mandi ERP Login</h2>
          <input placeholder="Username" style={inputStyle} />
          <input type="password" placeholder="Password" style={inputStyle} />
          <button style={buttonStyle} onClick={() => setLoggedIn(true)}>
            Login
          </button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "Dashboard":
        return (
          <div>
            <h2>Dashboard</h2>

            <div style={cardGrid}>
              <div style={cardStyle}>Total Inventory Received Today</div>
              <div style={cardStyle}>Total Sales Today</div>
              <div style={cardStyle}>Pending Payments</div>
            </div>

            {/* Simple Chart */}
            <div style={chartBox}>
              <h3>Weekly Sales Chart</h3>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", height: "150px" }}>
                <div style={{ width: "40px", height: "60px", background: "#facc15" }}></div>
                <div style={{ width: "40px", height: "100px", background: "#f59e0b" }}></div>
                <div style={{ width: "40px", height: "80px", background: "#eab308" }}></div>
                <div style={{ width: "40px", height: "120px", background: "#d97706" }}></div>
              </div>
            </div>
          </div>
        );

      case "Suppliers":
        return (
          <div>
            <h2>Suppliers</h2>
            <table border="1" cellPadding="10" width="100%">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Village</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Ramu</td>
                  <td>9999999999</td>
                  <td>Village A</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case "Buyers":
        return (
          <div>
            <h2>Buyers</h2>
            <table border="1" cellPadding="10" width="100%">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Shop</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Gopal</td>
                  <td>7777777777</td>
                  <td>Shop A</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case "Inventory":
        return (
          <div>
            <h2>Inventory Intake</h2>
            <input placeholder="Product" style={inputStyle} />
            <input placeholder="Quantity" style={inputStyle} />
            <button style={buttonStyle}>Add Entry</button>
          </div>
        );

      case "Reports":
        return (
          <div>
            <h2>Reports</h2>
            <p>Total Sales: ₹15,000</p>
            <p>Total Expenses: ₹2,500</p>
            <p>Outstanding Balance: ₹4,000</p>
          </div>
        );

      case "Invoice":
        return (
          <div>
            <h2>Invoice</h2>
            <table border="1" cellPadding="10" width="100%">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tomato</td>
                  <td>50</td>
                  <td>20</td>
                  <td>1000</td>
                </tr>
              </tbody>
            </table>

            <button style={{ ...buttonStyle, marginTop: "20px" }} onClick={() => window.print()}>
              Print Invoice
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Arial" }}>
      
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <h2 style={{ color: "#facc15" }}>Mandi ERP</h2>

        {menuItems.map((item, index) => (
          <p
            key={index}
            onClick={() => setPage(item)}
            style={{
              padding: "10px",
              cursor: "pointer",
              background: page === item ? "#1f2937" : "transparent",
              borderRadius: "8px"
            }}
          >
            {item}
          </p>
        ))}

        <button style={{ ...buttonStyle, background: "#dc2626" }} onClick={() => setLoggedIn(false)}>
          Logout
        </button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "30px" }}>
        <h1 style={{ color: "#d97706" }}>Trade Operations Dashboard</h1>
        {renderPage()}
      </div>
    </div>
  );
}

const loginWrapper = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  background: "#f3f4f6"
};

const loginBox = {
  background: "white",
  padding: "40px",
  borderRadius: "12px",
  width: "320px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "15px"
};

const buttonStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "15px",
  background: "#facc15",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer"
};

const sidebarStyle = {
  width: "240px",
  background: "#111827",
  color: "white",
  minHeight: "100vh",
  padding: "20px"
};

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
  gap: "20px"
};

const cardStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
};

const chartBox = {
  marginTop: "30px",
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
};

export default App;