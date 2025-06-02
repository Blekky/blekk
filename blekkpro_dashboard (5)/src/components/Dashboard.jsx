export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Welcome to BlekkPro</h1>
      <p className="text-gray-700">Begin your PMU consultation process.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded">New Client</div>
        <div className="p-4 bg-white border rounded">Lip Consultation</div>
        <div className="p-4 bg-white border rounded">AI Analysis</div>
      </div>
    </div>
  );
}
