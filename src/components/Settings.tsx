import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Plus, 
  Trash2, 
  Clock,
  QrCode,
  ArrowLeft
} from 'lucide-react';
import Logo from './Logo';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState<Category>({
    name: '',
    prefix: '',
    description: '',
    color: '#3B82F6'
  });
  const [newTrigger, setNewTrigger] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await window.electronAPI.getSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Kunde inte ladda inställningar:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      await window.electronAPI.saveSettings(settings);
      alert('Inställningar sparade!');
    } catch (error) {
      console.error('Kunde inte spara inställningar:', error);
      alert('Fel vid sparning av inställningar');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (!settings || !newCategory.name.trim() || !newCategory.prefix.trim()) return;
    
    const categoryKey = newCategory.name.toLowerCase().replace(/\s+/g, '_');
    setSettings({
      ...settings,
      categories: {
        ...settings.categories,
        [categoryKey]: { ...newCategory }
      }
    });
    
    setNewCategory({ name: '', prefix: '', description: '', color: '#3B82F6' });
  };

  const removeCategory = (categoryKey: string) => {
    if (!settings) return;
    
    const newCategories = { ...settings.categories };
    delete newCategories[categoryKey];
    
    setSettings({
      ...settings,
      categories: newCategories
    });
  };

  const addTrigger = () => {
    if (!settings || !newTrigger.trim()) return;
    
    setSettings({
      ...settings,
      triggerBarcodes: [...settings.triggerBarcodes, newTrigger.trim()]
    });
    
    setNewTrigger('');
  };

  const removeTrigger = (index: number) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      triggerBarcodes: settings.triggerBarcodes.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar inställningar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={24} />
              </button>
              <Logo />
            </div>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              <Save size={20} />
              {saving ? 'Sparar...' : 'Spara'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* General Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <SettingsIcon size={24} />
              Allmänna inställningar
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock size={16} className="inline mr-1" />
                  Scanner timeout (sekunder)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={settings?.scanTimeout || 10}
                  onChange={(e) => settings && setSettings({
                    ...settings,
                    scanTimeout: parseInt(e.target.value) || 10
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Hur länge scanner-fönstret ska vara öppet
                </p>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Kategorier
            </h2>
            
            <div className="space-y-3 mb-4">
              {settings && Object.entries(settings.categories).map(([key, category]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div>
                      <p className="font-medium text-gray-900">{category.name}</p>
                      <p className="text-sm text-gray-500">Prefix: {category.prefix}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeCategory(key)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Category */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Lägg till kategori</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Kategorinamn"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="p-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Prefix (t.ex. KÄKX)"
                  value={newCategory.prefix}
                  onChange={(e) => setNewCategory({ ...newCategory, prefix: e.target.value.toUpperCase() })}
                  className="p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-12 h-10 rounded border"
                />
                <button
                  onClick={addCategory}
                  disabled={!newCategory.name.trim() || !newCategory.prefix.trim()}
                  className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  <Plus size={16} />
                  Lägg till
                </button>
              </div>
            </div>
          </div>

          {/* Trigger Barcodes */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <QrCode size={24} />
              Trigger-streckkoder
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {settings && settings.triggerBarcodes.map((trigger, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                  <span className="font-mono text-sm">{trigger}</span>
                  <button
                    onClick={() => removeTrigger(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Trigger */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Ny trigger-kod"
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg"
              />
              <button
                onClick={addTrigger}
                disabled={!newTrigger.trim()}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Plus size={16} />
                Lägg till
              </button>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Tips:</strong> Skapa utskrivbara streckkoder för dessa trigger-koder och sätt upp dem där personalen scannar utrustning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
