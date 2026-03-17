import React from "react";

const Dashboard = () => {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-yellow-400 p-4 rounded shadow text-white font-bold">
        Total Inventory Received Today
      </div>
      <div className="bg-yellow-500 p-4 rounded shadow text-white font-bold">
        Total Sales Today
      </div>
      <div className="bg-yellow-600 p-4 rounded shadow text-white font-bold">
        Pending Payments
      </div>
      <div className="bg-gray-700 p-4 rounded shadow text-white font-bold">
        Outstanding Balance
      </div>
      <div className="bg-gray-600 p-4 rounded shadow text-white font-bold">
        Expense Overview
      </div>
    </div>
  );
};

export default Dashboard;