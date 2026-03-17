export default function Suppliers() {
  const suppliers = [
    { name: "Ramesh", phone: "9876543210", village: "Village A", govId: "12345", idType: "Aadhar", notes: "Good supplier" },
    { name: "Suresh", phone: "8765432109", village: "Village B", govId: "67890", idType: "PAN", notes: "Delayed delivery" },
  ];

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Suppliers</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Village</th>
              <th className="p-2 text-left">Gov ID</th>
              <th className="p-2 text-left">ID Type</th>
              <th className="p-2 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.phone}</td>
                <td className="p-2">{s.village}</td>
                <td className="p-2">{s.govId}</td>
                <td className="p-2">{s.idType}</td>
                <td className="p-2">{s.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}