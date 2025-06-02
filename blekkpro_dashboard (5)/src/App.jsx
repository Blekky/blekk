import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

function App() {
  const [selectedTool, setSelectedTool] = useState("home");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
      <div className="flex-1 p-6">
        {selectedTool === "home" && <Dashboard />}
        {/* More components to come */}
      </div>
    </div>
  );
}

export default App;
