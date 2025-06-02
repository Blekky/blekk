export default function Sidebar({ selectedTool, setSelectedTool }) {
  const tools = ["home", "symmetry", "lips", "ai", "layers"];
  return (
    <div className="w-64 bg-white border-r p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">BlekkPro</h2>
      <ul className="space-y-2">
        {tools.map(tool => (
          <li key={tool}>
            <button
              className={`w-full text-left p-2 rounded ${selectedTool === tool ? 'bg-gray-200' : ''}`}
              onClick={() => setSelectedTool(tool)}
            >
              {tool.charAt(0).toUpperCase() + tool.slice(1)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
