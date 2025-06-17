import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Package, 
  Tags,
  Search,
  ArrowLeft
} from 'lucide-react';

interface Equipment {
  id?: number;
  barcode: string;
  name: string;
  category: string;
  description?: string;
  status: 'available' | 'checked_out' | 'maintenance';
  created_at?: Date;
}

interface Category {
  id?: number;
  prefix: string;
  name: string;
  description?: string;
}

export default function AdminView() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'categories'>('equipment');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [equipmentData, categoryData] = await Promise.all([
        window.electronAPI.getEquipment(),
        window.electronAPI.getCategories()
      ]);
      setEquipment(equipmentData);
      setCategories(categoryData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const saveEquipment = async (item: Equipment) => {
    try {
      if (item.id) {
        await window.electronAPI.updateEquipment(item);
      } else {
        await window.electronAPI.addEquipment(item);
      }
      loadData();
      setEditingEquipment(null);
      setIsAddingEquipment(false);
    } catch (error) {
      console.error('Failed to save equipment:', error);
    }
  };

  const deleteEquipment = async (id: number) => {
    if (confirm('Are you sure you want to delete this equipment?')) {
      try {
        await window.electronAPI.deleteEquipment(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete equipment:', error);
      }
    }
  };

  const saveCategory = async (category: Category) => {
    try {
      if (category.id) {
        await window.electronAPI.updateCategory(category);
      } else {
        await window.electronAPI.addCategory(category);
      }
      loadData();
      setEditingCategory(null);
      setIsAddingCategory(false);
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const deleteCategory = async (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await window.electronAPI.deleteCategory(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const goBack = () => {
    window.electronAPI.showDashboard();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Administration
              </h1>
              <p className="text-gray-600 mt-1">
                Manage equipment and categories
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'equipment'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Equipment
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'categories'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <Tags className="w-4 h-4 inline mr-2" />
            Categories
          </button>
        </div>

        {/* Equipment Tab */}
        {activeTab === 'equipment' && (
          <div className="space-y-6">
            {/* Search and Add */}
            <div className="flex justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>
              <button
                onClick={() => setIsAddingEquipment(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Equipment
              </button>
            </div>

            {/* Equipment List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barcode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'available' ? 'bg-green-100 text-green-800' :
                          item.status === 'checked_out' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingEquipment(item)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => item.id && deleteEquipment(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setIsAddingCategory(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prefix
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {category.prefix}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {category.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingCategory(category)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => category.id && deleteCategory(category.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Equipment Modal */}
      {(editingEquipment || isAddingEquipment) && (
        <EquipmentModal
          equipment={editingEquipment}
          categories={categories}
          onSave={saveEquipment}
          onClose={() => {
            setEditingEquipment(null);
            setIsAddingEquipment(false);
          }}
        />
      )}

      {/* Category Modal */}
      {(editingCategory || isAddingCategory) && (
        <CategoryModal
          category={editingCategory}
          onSave={saveCategory}
          onClose={() => {
            setEditingCategory(null);
            setIsAddingCategory(false);
          }}
        />
      )}
    </div>
  );
}

// Equipment Modal Component
function EquipmentModal({ 
  equipment, 
  categories, 
  onSave, 
  onClose 
}: {
  equipment: Equipment | null;
  categories: Category[];
  onSave: (equipment: Equipment) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Equipment>(
    equipment || {
      barcode: '',
      name: '',
      category: '',
      description: '',
      status: 'available'
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {equipment ? 'Edit Equipment' : 'Add Equipment'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barcode
            </label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name} ({cat.prefix})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Equipment['status'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="available">Available</option>
              <option value="checked_out">Checked Out</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Category Modal Component
function CategoryModal({ 
  category, 
  onSave, 
  onClose 
}: {
  category: Category | null;
  onSave: (category: Category) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Category>(
    category || {
      prefix: '',
      name: '',
      description: ''
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {category ? 'Edit Category' : 'Add Category'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prefix
            </label>
            <input
              type="text"
              value={formData.prefix}
              onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., KÄKX, ORTO"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Käkkirurgi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
