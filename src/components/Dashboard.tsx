import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download,
  Calendar,
  TrendingUp,
  Shield
} from 'lucide-react';

interface ScanLog {
  id: number;
  barcode: string;
  category: string;
  action: 'checkout' | 'checkin';
  timestamp: Date;
  metadata?: any;
}

interface Statistics {
  totalScans: number;
  checkouts: number;
  checkins: number;
  categoriesUsed: number;
  todayScans: number;
  categories: { [key: string]: number };
}

export default function Dashboard() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [recentLogs, setRecentLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [stats, logs] = await Promise.all([
        window.electronAPI.getStatistics(),
        window.electronAPI.getScanLogs({ limit: 10 })
      ]);
      
      setStatistics(stats);
      setRecentLogs(logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      })));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: 'csv' | 'json') => {
    try {
      const result = await window.electronAPI.exportData(format);
      if (result.success) {
        // Show success notification
        console.log('Export successful:', result.filePath);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  const minimizeToTray = () => {
    window.electronAPI.minimizeToTray();
  };
  const showAdmin = () => {
    window.location.hash = '/admin';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Harrys lilla Lager
              </h1>
              <p className="text-gray-600 mt-1">
                Övervaka och hantera lagerföljning
              </p>
            </div>
          </div><div className="flex gap-3">
            <button
              onClick={showAdmin}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
            <button
              onClick={() => exportData('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => exportData('json')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >              <Download className="w-4 h-4" />
              Exportera JSON
            </button>
            <button
              onClick={minimizeToTray}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Minimera till systemfältet
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totalt skanningar</p>
                <p className="text-3xl font-bold text-gray-900">
                  {statistics?.totalScans || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utlämningar</p>
                <p className="text-3xl font-bold text-gray-900">
                  {statistics?.checkouts || 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ArrowUpRight className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Återlämningar</p>
                <p className="text-3xl font-bold text-gray-900">
                  {statistics?.checkins || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ArrowDownLeft className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dagens skanningar</p>
                <p className="text-3xl font-bold text-gray-900">
                  {statistics?.todayScans || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">              <h2 className="text-xl font-semibold text-gray-900">
                Kategorifördelning
              </h2>
              <Package className="w-5 h-5 text-gray-500" />
            </div>
            <div className="space-y-4">
              {statistics?.categories && Object.entries(statistics.categories).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{
                          width: `${Math.min((count / Math.max(...Object.values(statistics.categories))) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
              {(!statistics?.categories || Object.keys(statistics.categories).length === 0) && (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Senaste aktivitet
              </h2>
              <TrendingUp className="w-5 h-5 text-gray-500" />
            </div>
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      log.action === 'checkout' 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {log.action === 'checkout' ? 
                        <ArrowUpRight className="w-4 h-4" /> : 
                        <ArrowDownLeft className="w-4 h-4" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{log.category}</p>
                      <p className="text-sm text-gray-500">{log.barcode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {log.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {recentLogs.length === 0 && (
                <p className="text-gray-500 text-center py-4">Ingen senaste aktivitet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
