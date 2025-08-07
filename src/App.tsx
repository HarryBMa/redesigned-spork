import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainInventoryApp from './components/MainInventoryApp';
import ScanPopup from './components/ScanPopup';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainInventoryApp />} />
        <Route path="/scan-popup" element={<ScanPopup />} />
      </Routes>
    </Router>
  );
};

export default App;
