import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const Orders = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/orders',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      placed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
      returned: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const filteredOrders = orders
    .filter(order => {
      if (filter === 'all') return true;
      return order.status === filter;
    })
    .filter(order => {
      if (!searchTerm) return true;
      return order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
             order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-white text-xl">Loading your orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8">My Orders</h1>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'placed', label: 'Placed' },
              { key: 'processing', label: 'Processing' },
              { key: 'shipped', label: 'Shipped' },
              { key: 'delivered', label: 'Delivered' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  filter === key
                    ? 'bg-violet-600 text-white'
                    : 'bg-midnight border border-violet-500/30 text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-24 h-24 mx-auto text-gray-500 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">
              {orders.length === 0 ? 'No Orders Yet' : 'No Orders Found'}
            </h2>
            <p className="text-gray-400 mb-8">
              {orders.length === 0 
                ? 'Start shopping to see your orders here!'
                : 'Try adjusting your filters or search term'}
            </p>
            {orders.length === 0 && (
              <button
                onClick={() => navigate('/products')}
                className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-lg transition"
              >
                Start Shopping
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-midnight border border-violet-500/30 rounded-xl overflow-hidden hover:border-violet-500 transition"
              >
                <div 
                  onClick={() => navigate(`/orders/${order._id}`)}
                  className="p-6 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white mb-1">
                        {order.items.map((item, idx) => item.name).join(', ')}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''} • {order.payment.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-lg border text-sm font-semibold capitalize whitespace-nowrap ${getStatusColor(order.status)}`}>
                        {order.status === 'shipped' ? 'Out for Delivery' : order.status}
                      </span>
                      <div className="text-lg font-bold text-white whitespace-nowrap">
                        ₹{order.total.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {order.items.slice(0, 4).map((item, index) => (
                      <div key={index} className="flex-shrink-0">
                        <img
                          src={item.image || '/assets/images/placeholders/product-placeholder.jpg'}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded border border-violet-500/20"
                        />
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="flex-shrink-0 w-16 h-16 bg-midnight border border-violet-500/30 rounded flex items-center justify-center text-gray-400 text-xs font-semibold">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
