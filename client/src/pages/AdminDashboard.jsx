import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  IndianRupee,
  AlertCircle,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import useStore from '../store/useStore';
import { getEffectivePrice } from '../utils/priceUtils';

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#6366F1'];

const AdminDashboard = () => {
  const { token } = useStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/admin/dashboard/stats?period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!stats) return null;

  const { overview, ordersByStatus, recentOrders, topProducts, lowStockProducts } = stats;

  const orderStatusData = ordersByStatus.map(item => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-midnight border border-violet-500/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${overview.revenue.totalRevenue.toLocaleString('en-IN')}`}
          icon={<IndianRupee className="w-6 h-6" />}
          trend={overview.revenueGrowth}
          bgColor="bg-gradient-to-br from-violet-600/20 to-violet-900/20"
        />
        <StatCard
          title="Total Orders"
          value={overview.totalOrders}
          icon={<ShoppingCart className="w-6 h-6" />}
          subtext={`Avg: ₹${Math.round(overview.revenue.averageOrderValue).toLocaleString('en-IN')}`}
          bgColor="bg-gradient-to-br from-pink-600/20 to-pink-900/20"
        />
        <StatCard
          title="Total Users"
          value={overview.totalUsers}
          icon={<Users className="w-6 h-6" />}
          bgColor="bg-gradient-to-br from-blue-600/20 to-blue-900/20"
        />
        <StatCard
          title="Total Products"
          value={overview.totalProducts}
          icon={<Package className="w-6 h-6" />}
          alert={overview.outOfStockCount > 0 ? `${overview.outOfStockCount} out of stock` : null}
          bgColor="bg-gradient-to-br from-amber-600/20 to-amber-900/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Top Selling Products</h2>
            <Link to="/admin/products" className="text-violet-400 hover:text-violet-300 text-sm">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product._id} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-violet-600/20 rounded-lg flex items-center justify-center text-white font-bold">
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{product.name}</p>
                  <p className="text-gray-400 text-sm">
                    {product.purchaseCount} sales • ₹{getEffectivePrice(product).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-gradient-to-br from-amber-600/10 to-amber-900/10 border border-amber-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Low Stock Alert</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lowStockProducts.slice(0, 4).map((product) => (
              <div key={product._id} className="bg-midnight/50 rounded-lg p-4">
                <p className="text-white font-medium mb-1 truncate">{product.name}</p>
                <p className="text-amber-400 text-sm font-bold">
                  Only {product.totalStock} left
                </p>
              </div>
            ))}
          </div>
          {lowStockProducts.length > 4 && (
            <Link
              to="/admin/products?stock=low"
              className="text-amber-400 hover:text-amber-300 text-sm mt-4 inline-block"
            >
              View all {lowStockProducts.length} low stock products →
            </Link>
          )}
        </div>
      )}

      <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Orders</h2>
          <Link to="/admin/orders" className="text-violet-400 hover:text-violet-300 text-sm">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-violet-500/30">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Order ID</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Customer</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Total</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order._id} className="border-b border-violet-500/10 hover:bg-violet-500/5">
                  <td className="py-3 px-4 text-white font-mono text-sm">{order.orderNumber}</td>
                  <td className="py-3 px-4 text-white">{order.user?.name || 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-white font-semibold">
                    ₹{order.total.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/admin/orders/${order._id}`}
                      className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, subtext, alert, bgColor }) => {
  return (
    <div className={`${bgColor} border border-violet-500/30 rounded-xl p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-violet-400">{icon}</div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-gray-400 text-sm">{title}</p>
        {subtext && <p className="text-violet-400 text-sm mt-1">{subtext}</p>}
        {alert && (
          <div className="flex items-center gap-1 mt-2 text-amber-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {alert}
          </div>
        )}
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  const colors = {
    placed: 'bg-blue-500/20 text-blue-400',
    processing: 'bg-yellow-500/20 text-yellow-400',
    shipped: 'bg-purple-500/20 text-purple-400',
    delivered: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
    returned: 'bg-orange-500/20 text-orange-400',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400';
};

export default AdminDashboard;
