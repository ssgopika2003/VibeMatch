import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  Search,
  Eye,
  ShoppingCart,
  IndianRupee,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import useStore from '../../store/useStore';

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#EF4444'];

const Analytics = () => {
  const { token } = useStore();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/admin/analytics?period=${timeRange}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // TODO: Implement CSV export
    alert('Export functionality coming soon!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!analytics) return null;

  const { 
    salesTrend, 
    topSearchKeywords, 
    topViewedProducts, 
    topPurchasedProducts,
    conversionRate,
    customerInsights 
  } = analytics;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Advanced Analytics</h1>
          <p className="text-gray-400 mt-1">Deep insights into your store's performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-midnight border border-violet-500/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
            style={{ colorScheme: 'dark' }}
          >
            <option value="7" className="bg-midnight text-white">Last 7 days</option>
            <option value="30" className="bg-midnight text-white">Last 30 days</option>
            <option value="90" className="bg-midnight text-white">Last 90 days</option>
            <option value="365" className="bg-midnight text-white">Last year</option>
          </select>
          <button
            onClick={exportData}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-violet-500/30">
        {['overview', 'sales', 'customers', 'products'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition ${
              activeTab === tab
                ? 'text-violet-400 border-b-2 border-violet-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Sales"
              value={`₹${salesTrend.reduce((sum, item) => sum + item.revenue, 0).toLocaleString('en-IN')}`}
              icon={<IndianRupee className="w-6 h-6" />}
              trend={12.5}
              bgColor="bg-gradient-to-br from-violet-600/20 to-violet-900/20"
            />
            <MetricCard
              title="Conversion Rate"
              value={`${conversionRate.toFixed(2)}%`}
              icon={<TrendingUp className="w-6 h-6" />}
              trend={conversionRate > 3 ? 5.2 : -2.1}
              bgColor="bg-gradient-to-br from-pink-600/20 to-pink-900/20"
            />
            <MetricCard
              title="Avg Order Value"
              value={`₹${salesTrend.length ? Math.round(salesTrend.reduce((sum, item) => sum + item.revenue, 0) / salesTrend.reduce((sum, item) => sum + item.orders, 0)).toLocaleString('en-IN') : 0}`}
              icon={<ShoppingCart className="w-6 h-6" />}
              bgColor="bg-gradient-to-br from-blue-600/20 to-blue-900/20"
            />
            <MetricCard
              title="Total Searches"
              value={topSearchKeywords.reduce((sum, item) => sum + item.count, 0)}
              icon={<Search className="w-6 h-6" />}
              bgColor="bg-gradient-to-br from-amber-600/20 to-amber-900/20"
            />
          </div>

          {/* Sales Trend Chart */}
          <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Sales Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #8B5CF6' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8B5CF6" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Keywords & Products Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Search Keywords */}
            <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Top Search Keywords</h2>
                <Search className="w-5 h-5 text-violet-400" />
              </div>
              <div className="space-y-3">
                {topSearchKeywords.slice(0, 8).map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-mono text-sm">#{index + 1}</span>
                      <span className="text-white font-medium">{keyword._id || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-violet-400 font-semibold">{keyword.count}</span>
                      <div className="w-20 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-violet-500 h-2 rounded-full"
                          style={{ width: `${(keyword.count / topSearchKeywords[0]?.count) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Viewed Products */}
            <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Top Viewed Products</h2>
                <Eye className="w-5 h-5 text-pink-400" />
              </div>
              <div className="space-y-3">
                {topViewedProducts.slice(0, 8).map((product, index) => (
                  <div key={product._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-mono text-sm">#{index + 1}</span>
                      <div>
                        <p className="text-white font-medium truncate max-w-[180px]">
                          {product.product?.name || 'Product Not Found'}
                        </p>
                        <p className="text-gray-400 text-sm">{product.views} views</p>
                      </div>
                    </div>
                    <div className="text-pink-400 font-semibold">
                      {product.views}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Sales by Day Chart */}
          <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Daily Sales Overview</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #8B5CF6' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#8B5CF6" name="Revenue (₹)" />
                <Bar dataKey="orders" fill="#EC4899" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Purchased Products */}
          <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Top Purchased Products</h2>
              <ShoppingCart className="w-5 h-5 text-violet-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-violet-500/30">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">#</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Product</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Sales</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Revenue</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {topPurchasedProducts.slice(0, 10).map((product, index) => (
                    <tr key={product._id} className="border-b border-violet-500/10 hover:bg-violet-500/5 transition">
                      <td className="py-3 px-4 text-gray-400">{index + 1}</td>
                      <td className="py-3 px-4">
                        <p className="text-white font-medium">{product.product?.name || 'N/A'}</p>
                        <p className="text-gray-400 text-sm">{product.product?.category || 'N/A'}</p>
                      </td>
                      <td className="py-3 px-4 text-white font-semibold">{product.sales}</td>
                      <td className="py-3 px-4 text-violet-400 font-semibold">
                        ₹{product.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        ₹{Math.round(product.revenue / product.sales).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
              <h3 className="text-gray-400 mb-2">New Customers</h3>
              <p className="text-3xl font-bold text-white">{customerInsights?.newCustomers || 0}</p>
              <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                15% from last period
              </p>
            </div>
            <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
              <h3 className="text-gray-400 mb-2">Repeat Customers</h3>
              <p className="text-3xl font-bold text-white">{customerInsights?.repeatCustomers || 0}</p>
              <p className="text-violet-400 text-sm mt-2">
                {customerInsights?.repeatRate ? `${customerInsights.repeatRate.toFixed(1)}% repeat rate` : 'N/A'}
              </p>
            </div>
            <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
              <h3 className="text-gray-400 mb-2">Avg Lifetime Value</h3>
              <p className="text-3xl font-bold text-white">
                ₹{customerInsights?.avgLifetimeValue ? Math.round(customerInsights.avgLifetimeValue).toLocaleString('en-IN') : '0'}
              </p>
              <p className="text-blue-400 text-sm mt-2">Per customer</p>
            </div>
          </div>

          <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Customer Behavior Insights</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-violet-500/10 rounded-lg">
                <div>
                  <p className="text-white font-medium">Average Session Duration</p>
                  <p className="text-gray-400 text-sm">Time spent browsing</p>
                </div>
                <p className="text-2xl font-bold text-violet-400">8m 32s</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-pink-500/10 rounded-lg">
                <div>
                  <p className="text-white font-medium">Products per Session</p>
                  <p className="text-gray-400 text-sm">Average views per visit</p>
                </div>
                <p className="text-2xl font-bold text-pink-400">4.7</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg">
                <div>
                  <p className="text-white font-medium">Cart Abandonment Rate</p>
                  <p className="text-gray-400 text-sm">Carts not converted</p>
                </div>
                <p className="text-2xl font-bold text-blue-400">32%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Performance */}
            <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Product Performance Matrix</h2>
              <div className="space-y-3">
                {topPurchasedProducts.slice(0, 5).map((product, index) => {
                  const viewed = topViewedProducts.find(v => v._id === product._id);
                  const convRate = viewed ? ((product.sales / viewed.views) * 100).toFixed(1) : 0;
                  return (
                    <div key={product._id} className="p-4 bg-midnight border border-violet-500/20 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-white font-medium">{product.product?.name || 'N/A'}</p>
                        <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-400 rounded">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-gray-400 text-xs">Views</p>
                          <p className="text-white font-semibold">{viewed?.views || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Sales</p>
                          <p className="text-white font-semibold">{product.sales}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Conv. Rate</p>
                          <p className="text-violet-400 font-semibold">{convRate}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Sales by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topPurchasedProducts.slice(0, 6).map(p => ({
                      name: p.product?.category || 'Other',
                      value: p.revenue
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topPurchasedProducts.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #8B5CF6' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, icon, trend, bgColor }) => (
  <div className={`${bgColor} border border-violet-500/30 rounded-xl p-6`}>
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-violet-500/20 rounded-lg text-violet-400">
        {icon}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

export default Analytics;
