import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Plus, 
  Trash2, 
  Package,
  Clock,
  QrCode
} from 'lucide-react';
import BarcodeGenerator from './BarcodeGenerator';

interface Category {
  name: string;
  prefix: string;
  description?: string;
  color?: string;
}

interface AppSettings {
  scanTimeout: number;
  categories: { [key: string]: Category };
  triggerBarcodes: string[];
}

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState<Category>({
    name: '',
    prefix: '',
    description: '',
    color: '#3B82F6'
  });
  const [newTrigger, setNewTrigger] = useState('');
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await window.electronAPI.getSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      await window.electronAPI.saveSettings(settings);
      // Show success message
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (!settings || !newCategory.name || !newCategory.prefix) return;

    const updatedSettings = {
      ...settings,
      categories: {
        ...settings.categories,
        [newCategory.prefix.toUpperCase()]: {
          ...newCategory,
          prefix: newCategory.prefix.toUpperCase()
        }
      }
    };

    setSettings(updatedSettings);
    setNewCategory({ name: '', prefix: '', description: '', color: '#3B82F6' });
  };

  const removeCategory = (prefix: string) => {
    if (!settings) return;

    const { [prefix]: removed, ...remainingCategories } = settings.categories;
    setSettings({
      ...settings,
      categories: remainingCategories
    });
  };

  const addTriggerBarcode = () => {
    if (!settings || !newTrigger.trim()) return;

    const updatedTriggers = [...settings.triggerBarcodes, newTrigger.toUpperCase()];
    setSettings({
      ...settings,
      triggerBarcodes: updatedTriggers
    });
    setNewTrigger('');
  };

  const removeTriggerBarcode = (index: number) => {
    if (!settings) return;

    const updatedTriggers = settings.triggerBarcodes.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      triggerBarcodes: updatedTriggers
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load settings</p>
          <button 
            onClick={loadSettings}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Konfigurera ditt lagerhanteringssystem</p>
            </div>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="space-y-8">
          {/* Scan Timeout Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Scan Window Timeout</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-close timeout (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={settings.scanTimeout / 1000}
                  onChange={(e) => setSettings({
                    ...settings,
                    scanTimeout: parseInt(e.target.value) * 1000
                  })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  The scan window will automatically close after this many seconds of inactivity
                </p>
              </div>
            </div>
          </div>

          {/* Trigger Barcodes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <QrCode className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Trigger Barcodes</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                These barcodes will activate the scan window when scanned
              </p>
                <div className="flex gap-2">
                <input
                  type="text"
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  placeholder="Enter trigger barcode..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addTriggerBarcode}
                  disabled={!newTrigger.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowBarcodeGenerator(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  title="Generate printable trigger barcode"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {settings.triggerBarcodes.map((trigger, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-gray-900">{trigger}</span>
                    <button
                      onClick={() => removeTriggerBarcode(index)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Item Categories</h2>
            </div>
            
            {/* Add New Category */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="e.g., Käkkirurgi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prefix</label>
                  <input
                    type="text"
                    value={newCategory.prefix}
                    onChange={(e) => setNewCategory({ ...newCategory, prefix: e.target.value.toUpperCase() })}
                    placeholder="e.g., KÄKX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="e.g., Käkkirurgiska instrument"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={addCategory}
                disabled={!newCategory.name || !newCategory.prefix}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            {/* Existing Categories */}
            <div className="space-y-3">
              {Object.entries(settings.categories).map(([prefix, category]) => (
                <div key={prefix} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-500">{category.description}</p>
                      <span className="text-xs font-mono text-gray-600">{category.prefix}</span>
                    </div>
                  </div>                  <div className="flex gap-2">
                    <button
                      onClick={() => removeCategory(prefix)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>          </div>
        </div>
      </div>
      
      {/* Barcode Generator Modal */}
      {showBarcodeGenerator && (
        <BarcodeGenerator onClose={() => setShowBarcodeGenerator(false)} />
      )}
    </div>
  );
}
