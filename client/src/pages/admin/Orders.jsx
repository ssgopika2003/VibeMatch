import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Search, 
  Filter,
  Eye,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  X
} from 'lucide-react';
import useStore from '../../store/useStore';

const AdminOrders = () => {
  const { token } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, statusFilter]);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const { data } = await axios.get(
        `/api/admin/orders?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const { data } = await axios.get(`/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedOrder(data.order);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Orders Management</h1>
        <p className="text-gray-400 mt-1">Track and manage customer orders</p>
      </div>

      {/* Filters */}
      <div className="bg-midnight border border-violet-500/30 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Statuses</option>
            <option value="placed">Placed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={pagination.totalOrders || 0}
          icon={<Package className="w-5 h-5" />}
          color="bg-violet-600/20 text-violet-400"
        />
        <StatCard
          title="Pending"
          value={orders.filter(o => ['placed', 'processing'].includes(o.status)).length}
          icon={<Clock className="w-5 h-5" />}
          color="bg-yellow-600/20 text-yellow-400"
        />
        <StatCard
          title="Out for Delivery"
          value={orders.filter(o => o.status === 'shipped').length}
          icon={<Truck className="w-5 h-5" />}
          color="bg-blue-600/20 text-blue-400"
        />
        <StatCard
          title="Delivered"
          value={orders.filter(o => o.status === 'delivered').length}
          icon={<CheckCircle className="w-5 h-5" />}
          color="bg-green-600/20 text-green-400"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-midnight border border-violet-500/30 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-violet-500/30 bg-violet-500/5">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Order ID</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Customer</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Date</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Items</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-right py-4 px-4 text-gray-400 font-medium">Total</th>
                <th className="text-right py-4 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto"></div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="border-b border-violet-500/10 hover:bg-violet-500/5">
                    <td className="py-4 px-4">
                      <p className="text-white font-mono text-sm">{order.orderNumber}</p>
                      <p className="text-gray-400 text-xs">
                        {order.isCompleteLook && '🎨 Complete Look'}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-white">{order.user?.name || 'N/A'}</p>
                      <p className="text-gray-400 text-sm">{order.user?.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-white">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-white">
                      {order.items.length} item(s)
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-white font-semibold">
                        ₹{order.total.toLocaleString('en-IN')}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {order.payment.method.toUpperCase()}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => viewOrderDetails(order._id)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-violet-500/30">
            <p className="text-gray-400 text-sm">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalOrders)} of {pagination.totalOrders} orders
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => fetchOrders(pagination.currentPage - 1)}
                className="px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-500/10"
              >
                Previous
              </button>
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => fetchOrders(pagination.currentPage + 1)}
                className="px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-500/10"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
          onUpdate={() => {
            fetchOrders(pagination.currentPage);
            viewOrderDetails(selectedOrder._id);
          }}
          token={token}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-midnight border border-violet-500/30 rounded-xl p-4">
    <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <p className="text-2xl font-bold text-white mb-1">{value}</p>
    <p className="text-gray-400 text-sm">{title}</p>
  </div>
);

const OrderDetailsModal = ({ order, onClose, onUpdate, token }) => {
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking?.trackingNumber || '');
  const [courier, setCourier] = useState(order.tracking?.courier || '');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      await axios.put(
        `/api/admin/orders/${order._id}/status`,
        { status, trackingNumber, courier, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Order status updated successfully');
      onUpdate();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-midnight border border-violet-500/30 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-midnight border-b border-violet-500/30 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Order Details</h2>
            <p className="text-gray-400 text-sm font-mono mt-1">{order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Customer Information</h3>
            <div className="bg-midnight rounded-lg p-4 space-y-2">
              <p className="text-white"><span className="text-gray-400">Name:</span> {order.user?.name}</p>
              <p className="text-white"><span className="text-gray-400">Email:</span> {order.user?.email}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Shipping Address</h3>
            <div className="bg-midnight rounded-lg p-4">
              <p className="text-white">{order.shippingAddress.fullName}</p>
              <p className="text-gray-400">{order.shippingAddress.phone}</p>
              <p className="text-gray-400 mt-2">
                {order.shippingAddress.addressLine1}<br />
                {order.shippingAddress.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
                {order.shippingAddress.country}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Order Items</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="bg-midnight rounded-lg p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-violet-600/20 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-gray-400 text-sm">
                      {item.size && `Size: ${item.size} • `}
                      {item.color && `Color: ${item.color} • `}
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="text-white font-semibold">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Order Summary</h3>
            <div className="bg-midnight rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Tax</span>
                  <span>₹{order.tax.toLocaleString('en-IN')}</span>
                </div>
              )}
              {order.shippingCharge > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span>₹{order.shippingCharge.toLocaleString('en-IN')}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-₹{order.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="border-t border-violet-500/30 pt-2 mt-2 flex justify-between text-white font-bold text-lg">
                <span>Total</span>
                <span>₹{order.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Update Status */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Update Order Status</h3>
            <div className="bg-midnight rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-white mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="placed">Placed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="returned">Returned</option>
                </select>
              </div>

              {['shipped', 'delivered'].includes(status) && (
                <>
                  <div>
                    <label className="block text-white mb-2">Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Enter tracking number"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2">Courier</label>
                    <input
                      type="text"
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="e.g., Blue Dart, DTDC"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-white mb-2">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="2"
                  className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Add any notes about this status update"
                />
              </div>

              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Order Status'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getStatusStyle = (status) => {
  const styles = {
    placed: 'bg-blue-500/20 text-blue-400',
    processing: 'bg-yellow-500/20 text-yellow-400',
    shipped: 'bg-purple-500/20 text-purple-400',
    delivered: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
    returned: 'bg-orange-500/20 text-orange-400',
  };
  return styles[status] || 'bg-gray-500/20 text-gray-400';
};

const getStatusIcon = (status) => {
  const icons = {
    placed: <Clock className="w-3 h-3" />,
    processing: <Package className="w-3 h-3" />,
    shipped: <Truck className="w-3 h-3" />,
    delivered: <CheckCircle className="w-3 h-3" />,
    cancelled: <XCircle className="w-3 h-3" />,
    returned: <XCircle className="w-3 h-3" />,
  };
  return icons[status] || null;
};

export default AdminOrders;
