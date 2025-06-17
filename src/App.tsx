import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ScanWindow from './components/ScanWindow';
import Settings from './components/Settings';
import SimpleAdminView from './components/SimpleAdminView';
import './App.css';

function App() {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    setIsElectron(typeof window !== 'undefined' && window.electronAPI !== undefined);
  }, []);

  if (!isElectron) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Harrys lilla Lager
          </h1>
          <p className="text-gray-600 mb-4">
            Detta program är byggt för att köras som en Electron desktop-app.
          </p>
          <p className="text-sm text-gray-500">
            Vänligen bygg och kör Electron-applikationen för att använda alla funktioner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scan" element={<ScanWindow />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<SimpleAdminView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
