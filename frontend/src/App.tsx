import { useEffect, useState } from 'react';

function App() {
  const [status, setStatus] = useState('Testing connection...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('http://localhost:8000/health');
        const data = await response.json();
        setStatus(`Backend connected: ${data.status}`);
      } catch (err: any) {
        setStatus(`Backend error: ${err.message}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-green-600">Checkly</h1>
        <p className="text-gray-600 mt-2">{status}</p>
      </div>
    </div>
  );
}

export default App;