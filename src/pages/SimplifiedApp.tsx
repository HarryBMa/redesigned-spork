import React, { useState } from 'react';
import SimpleInventoryView from '@/pages/SimpleInventoryView';
import AdminSettings from '@/components/features/AdminSettings';

const SimplifiedApp: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <SimpleInventoryView onOpenSettings={() => setShowSettings(true)} />
      {showSettings && (
        <AdminSettings onClose={() => setShowSettings(false)} />
      )}
    </>
  );
};

export default SimplifiedApp;
