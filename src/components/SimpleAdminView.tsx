import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search,
  Package,
  Settings,
  Save,
  X,
  ArrowLeft
} from 'lucide-react';

interface Equipment {
  id?: number;
  barcode: string;
  name: string;
  category: string;
  status: 'available' | 'out';
  lastScanned?: Date;
}

interface Category {
  id?: number;
  name: string;
  prefix: string;
  color?: string;
}

export default function SimpleAdminView() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'equipment' | 'categories'>('equipment');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [newItem, setNewItem] = useState({
    barcode: '',
    name: '',
    category: '',
    prefix: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Auto-focus barcode input when dialog opens (TechCheck style)
    if (showAddDialog && activeTab === 'equipment' && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [showAddDialog, activeTab]);

  const loadData = async () => {
    try {
      // Mock data for now - in real app use electronAPI
      const equipmentData = [
        { id: 1, barcode: 'KÄKX001', name: 'Jaw Surgery Kit A', category: 'Käkkirurgi', status: 'available' as const },
        { id: 2, barcode: 'ORTO123', name: 'Orthopedic Drill Set', category: 'Ortopedi', status: 'out' as const },
        { id: 3, barcode: 'CARD456', name: 'Cardiac Clamp Set', category: 'Kardio', status: 'available' as const },
        { id: 4, barcode: 'NEUR789', name: 'Neurosurgery Tool Set', category: 'Neurokirurgi', status: 'available' as const }
      ];
      
      const categoryData = [
        { id: 1, name: 'Käkkirurgi', prefix: 'KÄKX', color: '#3B82F6' },
        { id: 2, name: 'Ortopedi', prefix: 'ORTO', color: '#10B981' },
        { id: 3, name: 'Kardio', prefix: 'CARD', color: '#F59E0B' },
        { id: 4, name: 'Neurokirurgi', prefix: 'NEUR', color: '#8B5CF6' }
      ];
      
      setEquipment(equipmentData);
      setCategories(categoryData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (activeTab === 'equipment') {
      if (!newItem.barcode || !newItem.name || !newItem.category) {
        alert('Please fill in all fields for equipment');
        barcodeInputRef.current?.focus();
        return;
      }
      
      // Check if barcode already exists (TechCheck style validation)
      if (equipment.some(item => item.barcode === newItem.barcode)) {
        alert('This barcode already exists in inventory');
        barcodeInputRef.current?.focus();
        return;
      }

      try {
        // In real app: await window.electronAPI.addEquipment(newItem);
        const newEquipment: Equipment = {
          id: equipment.length + 1,
          barcode: newItem.barcode,
          name: newItem.name,
          category: newItem.category,
          status: 'available'
        };
        
        setEquipment([...equipment, newEquipment]);
        resetForm();
        setShowAddDialog(false);
        
        alert('Equipment added successfully');
      } catch (error) {
        console.error('Failed to add equipment:', error);
      }
    } else {
      if (!newItem.name || !newItem.prefix) {
        alert('Please fill in category name and prefix');
        return;
      }

      try {
        // In real app: await window.electronAPI.addCategory(newItem);
        const newCategory: Category = {
          id: categories.length + 1,
          name: newItem.name,
          prefix: newItem.prefix,
          color: newItem.color
        };
        
        setCategories([...categories, newCategory]);
        resetForm();
        setShowAddDialog(false);
        
        alert('Category added successfully');
      } catch (error) {
        console.error('Failed to add category:', error);
      }
    }
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = 
      item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const goToHome = () => {
    window.location.hash = '/dashboard';
  };

  const resetForm = () => {
    setNewItem({ barcode: '', name: '', category: '', prefix: '', color: '#3B82F6' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - TechCheck inspired simple header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goToHome}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New {activeTab === 'equipment' ? 'Equipment' : 'Category'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        
        {/* Tab Navigation - Simple like TechCheck */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('equipment')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'equipment'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Equipment Inventory
                </div>
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Categories
                </div>
              </button>
            </nav>
          </div>

          {/* Search and Filter Bar */}
          {activeTab === 'equipment' && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by barcode or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Equipment Tab */}
        {activeTab === 'equipment' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barcode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEquipment.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {item.barcode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status === 'available' ? 'Available' : 'Checked Out'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredEquipment.length === 0 && (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No equipment found</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding some equipment.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prefix
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => {
                    const itemCount = equipment.filter(item => item.category === category.name).length;
                    return (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {category.prefix}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            {category.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {itemCount} items
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Item Dialog - TechCheck inspired modal */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Add New {activeTab === 'equipment' ? 'Equipment' : 'Category'}
              </h3>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'equipment' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scan Barcode:
                    </label>
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={newItem.barcode}
                      onChange={(e) => setNewItem({...newItem, barcode: e.target.value})}
                      onKeyPress={handleKeyPress}
                      placeholder="Scan barcode or type manually..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Equipment Name:
                    </label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter equipment name..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category:
                    </label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name:
                    </label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., Käkkirurgi"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barcode Prefix:
                    </label>
                    <input
                      type="text"
                      value={newItem.prefix}
                      onChange={(e) => setNewItem({...newItem, prefix: e.target.value.toUpperCase()})}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., KÄKX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color:
                    </label>
                    <input
                      type="color"
                      value={newItem.color}
                      onChange={(e) => setNewItem({...newItem, color: e.target.value})}
                      className="w-full h-10 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Add {activeTab === 'equipment' ? 'Equipment' : 'Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
