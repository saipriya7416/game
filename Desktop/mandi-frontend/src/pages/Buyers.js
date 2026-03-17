import React from "react";

const Buyers = () => {
  const buyers = [
    { name: "Gopal", phone: "7777777777", shop: "Shop A", address: "Town X", govId: "1111", credit: 5000 },
    { name: "Radha", phone: "6666666666", shop: "Shop B", address: "Town Y", govId: "2222", credit: 10000 },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Buyers</h2>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Shop Name</th>
            <th className="border p-2">Address</th>
            <th className="border p-2">Government ID</th>
            <th className="border p-2">Credit Limit</th>
          </tr>
        </thead>
        <tbody>
          {buyers.map((buyer, idx) => (
            <tr key={idx}>
              <td className="border p-2">{buyer.name}</td>
              <td className="border p-2">{buyer.phone}</td>
              <td className="border p-2">{buyer.shop}</td>
              <td className="border p-2">{buyer.address}</td>
              <td className="border p-2">{buyer.govId}</td>
              <td className="border p-2">{buyer.credit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Buyers;