import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download,
  Calendar,
  TrendingUp,
  Settings,
  Scan,
  Users
} from 'lucide-react';
import Logo from './Logo';

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
  const [view, setView] = useState('dashboard');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
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
      setLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoading(false);
    }
  };  const openScanner = () => {
    window.electronAPI?.showScanWindow();
  };

  const exportData = (format: 'csv' | 'json') => {
    window.electronAPI?.exportData(format);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Logo />
            <div className="flex gap-2">
              <button
                onClick={openScanner}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Scan size={20} />
                Öppna Scanner
              </button>
              <button
                onClick={() => setView(view === 'admin' ? 'dashboard' : 'admin')}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Settings size={20} />
                {view === 'admin' ? 'Dashboard' : 'Admin'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {view === 'admin' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminView />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<BarChart3 className="text-blue-600" size={24} />}
              title="Totala Scanningar"
              value={statistics?.totalScans || 0}
              color="blue"
            />
            <StatCard
              icon={<ArrowUpRight className="text-red-600" size={24} />}
              title="Utcheckningar"
              value={statistics?.checkouts || 0}
              color="red"
            />
            <StatCard
              icon={<ArrowDownLeft className="text-green-600" size={24} />}
              title="Incheckningar"
              value={statistics?.checkins || 0}
              color="green"
            />
            <StatCard
              icon={<Calendar className="text-purple-600" size={24} />}
              title="Idag"
              value={statistics?.todayScans || 0}
              color="purple"
            />
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={20} />
                  Kategorier
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportData('csv')}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Download size={16} />
                    CSV
                  </button>
                  <button
                    onClick={() => exportData('json')}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Download size={16} />
                    JSON
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                {statistics?.categories && Object.entries(statistics.categories).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${Math.min(100, (count / Math.max(...Object.values(statistics.categories))) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} />
                Senaste Aktivitet
              </h3>
              
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-3">
                      {log.action === 'checkout' ? (
                        <ArrowUpRight className="text-red-600" size={16} />
                      ) : (
                        <ArrowDownLeft className="text-green-600" size={16} />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.barcode}</p>
                        <p className="text-xs text-gray-500">{log.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${
                        log.action === 'checkout' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {log.action === 'checkout' ? 'UTCHECKNING' : 'INCHECKNING'}
                      </p>
                      <p className="text-xs text-gray-500">{formatTime(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// StatCard Component
function StatCard({ icon, title, value, color }: {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    red: 'bg-red-50 border-red-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200'
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]} bg-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString('sv-SE')}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

// Simple Admin Component
function AdminView() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Panel</h2>
      <p className="text-gray-600 mb-4">Hantera utrustning och kategorier</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Lägg till Utrustning</h3>
          <p className="text-sm text-gray-600 mb-3">Scanna eller skriv in streckkod för ny utrustning</p>
          <input
            type="text"
            placeholder="Streckkod..."
            className="w-full p-2 border rounded-md mb-2"
          />
          <input
            type="text"
            placeholder="Namn på utrustning..."
            className="w-full p-2 border rounded-md mb-2"
          />
          <select className="w-full p-2 border rounded-md mb-2">
            <option>Välj kategori...</option>
            <option>Käkkirurgi</option>
            <option>Ortopedi</option>
            <option>Neurologi</option>
            <option>Allmän kirurgi</option>
          </select>
          <button className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700">
            Lägg Till
          </button>
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Kategorier</h3>
          <p className="text-sm text-gray-600 mb-3">Hantera utrustningskategorier</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>Käkkirurgi</span>
              <span className="text-sm text-gray-500">KÄKX</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>Ortopedi</span>
              <span className="text-sm text-gray-500">ORTX</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>Neurologi</span>
              <span className="text-sm text-gray-500">NURX</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
