import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { 
  Package, Truck, CheckCircle, XCircle, Clock, 
  MapPin, Calendar, AlertCircle, RotateCcw, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const OrderTracking = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [customReturnReason, setCustomReturnReason] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [ratingProductId, setRatingProductId] = useState(null);

  const cancelReasons = [
    'Price is too high',
    'Found a better deal elsewhere',
    'Changed my mind',
    'Ordered by mistake',
    'Delivery time is too long',
    'Other'
  ];

  const returnReasons = [
    'Product is damaged/defective',
    'Wrong item received',
    'Size/fit issue',
    'Quality not as expected',
    'Color/style doesn\'t match',
    'Other'
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusConfig = {
      placed: { 
        color: 'text-blue-400', 
        bgColor: 'bg-blue-500/10', 
        icon: Clock,
        label: 'Order Placed'
      },
      processing: { 
        color: 'text-yellow-400', 
        bgColor: 'bg-yellow-500/10', 
        icon: Package,
        label: 'Processing'
      },
      shipped: { 
        color: 'text-purple-400', 
        bgColor: 'bg-purple-500/10', 
        icon: Truck,
        label: 'Out for Delivery'
      },
      delivered: { 
        color: 'text-green-400', 
        bgColor: 'bg-green-500/10', 
        icon: CheckCircle,
        label: 'Delivered'
      },
      cancelled: { 
        color: 'text-red-400', 
        bgColor: 'bg-red-500/10', 
        icon: XCircle,
        label: 'Cancelled'
      },
      returned: { 
        color: 'text-orange-400', 
        bgColor: 'bg-orange-500/10', 
        icon: RotateCcw,
        label: 'Returned'
      }
    };
    return statusConfig[status] || statusConfig.placed;
  };

  const canCancelOrder = (order) => {
    return ['placed', 'processing'].includes(order.status);
  };

  const canReturnOrder = (order) => {
    if (order.status !== 'delivered') return false;
    
    const deliveredDate = order.tracking?.deliveredAt 
      ? new Date(order.tracking.deliveredAt)
      : new Date(order.updatedAt);
    
    const daysSinceDelivery = Math.floor((Date.now() - deliveredDate) / (1000 * 60 * 60 * 24));
    return daysSinceDelivery <= 10;
  };

  const canRateOrder = (order) => {
    return order.status === 'delivered';
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    if (selectedOrder.status === 'shipped') {
      toast.error('Cannot cancel order - already out for delivery');
      setShowCancelModal(false);
      return;
    }

    const finalReason = cancelReason === 'Other' ? customReason : cancelReason;
    
    if (!finalReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      await axios.patch(
        `http://localhost:5000/api/orders/${selectedOrder._id}/cancel`,
        { reason: finalReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
      setCancelReason('');
      setCustomReason('');
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleReturnOrder = async () => {
    if (!selectedOrder) return;

    const finalReason = returnReason === 'Other' ? customReturnReason : returnReason;
    
    if (!finalReason.trim()) {
      toast.error('Please provide a return reason');
      return;
    }

    try {
      await axios.patch(
        `http://localhost:5000/api/orders/${selectedOrder._id}/return`,
        { reason: finalReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Return request submitted successfully');
      setShowReturnModal(false);
      setReturnReason('');
      setCustomReturnReason('');
      fetchOrders();
    } catch (error) {
      console.error('Error returning order:', error);
      toast.error(error.response?.data?.message || 'Failed to submit return request');
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingProductId || rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!review.trim()) {
      toast.error('Please write a review');
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/products/${ratingProductId}/reviews`,
        { rating, comment: review },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Thank you for your review!');
      setShowRatingModal(false);
      setRating(0);
      setReview('');
      setRatingProductId(null);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight py-20">
        <div className="container mx-auto px-4">
          <div className="text-center text-white">
            <div className="animate-spin w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Track Your Orders</h1>
          <p className="text-gray-400">Monitor your order status and manage returns</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-midnight border border-violet-500/30 rounded-xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Orders Yet</h3>
            <p className="text-gray-400 mb-6">Start shopping to see your orders here</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg transition"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div
                  key={order._id}
                  className="bg-midnight border border-violet-500/30 rounded-xl overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="p-6 border-b border-violet-500/30">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">
                            Order #{order.orderNumber}
                          </h3>
                          <span className={`flex items-center gap-2 px-3 py-1 rounded-lg ${statusInfo.bgColor}`}>
                            <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                            <span className={`text-sm font-semibold ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            <span>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">
                          ₹{order.total.toLocaleString('en-IN')}
                        </p>
                        <p className="text-sm text-gray-400">
                          {order.payment.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                        </p>
                      </div>
                    </div>

                    {/* Tracking Info */}
                    {order.tracking?.trackingNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                        <Truck className="w-4 h-4" />
                        <span>Tracking: {order.tracking.trackingNumber}</span>
                        {order.tracking.courier && (
                          <span className="text-violet-400">via {order.tracking.courier}</span>
                        )}
                      </div>
                    )}

                    {/* Delivery Address */}
                    <div className="flex items-start gap-2 text-sm text-gray-400">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, 
                        {order.shippingAddress.state} - {order.shippingAddress.pincode}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6 space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <img
                          src={item.image || '/assets/images/placeholders/product-placeholder.jpg'}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover border border-violet-500/30"
                        />
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{item.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && <span>Color: {item.color}</span>}
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Timeline */}
                  {order.timeline && order.timeline.length > 0 && (
                    <div className="px-6 pb-6">
                      <h4 className="text-white font-semibold mb-4">Order Timeline</h4>
                      <div className="space-y-3">
                        {order.timeline.map((event, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-violet-500 mt-2"></div>
                            <div className="flex-1">
                              <p className="text-white text-sm">{event.message}</p>
                              <p className="text-gray-400 text-xs">
                                {new Date(event.timestamp).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="p-6 border-t border-violet-500/30 flex gap-3">
                    {canCancelOrder(order) && (
                      <button
                        onClick={() => {
                          if (order.status === 'shipped') {
                            toast.error('Cannot cancel order - already out for delivery');
                          } else {
                            setSelectedOrder(order);
                            setShowCancelModal(true);
                          }
                        }}
                        className="px-4 py-2 text-red-400 hover:text-red-300 transition"
                      >
                        Cancel Order
                      </button>
                    )}
                    
                    {canReturnOrder(order) && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowReturnModal(true);
                        }}
                        className="px-4 py-2 text-orange-400 hover:text-orange-300 transition"
                      >
                        Return Order
                      </button>
                    )}
                    
                    {canRateOrder(order) && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowRatingModal(true);
                        }}
                        className="px-4 py-2 text-yellow-400 hover:text-yellow-300 transition flex items-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Rate Products
                      </button>
                    )}
                    
                    <button
                      onClick={() => navigate(`/orders/${order._id}`)}
                      className="ml-auto px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-midnight border border-violet-500/30 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-bold text-white">Cancel Order</h3>
            </div>
            
            <p className="text-gray-400 mb-4">
              Order #{selectedOrder.orderNumber}
            </p>

            <div className="mb-4">
              <label className="block text-white font-semibold mb-2">
                Reason for cancellation:
              </label>
              <div className="space-y-2">
                {cancelReasons.map((reason) => (
                  <label key={reason} className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason}
                      checked={cancelReason === reason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="text-violet-500"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {cancelReason === 'Other' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please specify your reason..."
                className="w-full bg-midnight border border-violet-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 mb-4"
                rows="3"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setCustomReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-midnight border border-violet-500/30 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <RotateCcw className="w-6 h-6 text-orange-400" />
              <h3 className="text-xl font-bold text-white">Return Order</h3>
            </div>
            
            <p className="text-gray-400 mb-4">
              Order #{selectedOrder.orderNumber}
            </p>

            <div className="mb-4">
              <label className="block text-white font-semibold mb-2">
                Reason for return:
              </label>
              <div className="space-y-2">
                {returnReasons.map((reason) => (
                  <label key={reason} className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="returnReason"
                      value={reason}
                      checked={returnReason === reason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="text-violet-500"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {returnReason === 'Other' && (
              <textarea
                value={customReturnReason}
                onChange={(e) => setCustomReturnReason(e.target.value)}
                placeholder="Please specify your reason..."
                className="w-full bg-midnight border border-violet-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 mb-4"
                rows="3"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnReason('');
                  setCustomReturnReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnOrder}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
              >
                Submit Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-midnight border border-violet-500/30 rounded-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">Rate Products</h3>
            </div>
            
            <div className="space-y-4">
              {selectedOrder.items.map((item, index) => (
                <div
                  key={index}
                  onClick={() => setRatingProductId(item.product)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    ratingProductId === item.product
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-violet-500/30 hover:border-violet-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={item.image || '/assets/images/placeholders/product-placeholder.jpg'}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{item.name}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {ratingProductId && (
              <>
                <div className="mt-6">
                  <label className="block text-white font-semibold mb-2">Your Rating:</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 transition ${
                            star <= rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-white font-semibold mb-2">Your Review:</label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="w-full bg-midnight border border-violet-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    rows="4"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setRating(0);
                  setReview('');
                  setRatingProductId(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={!ratingProductId || rating === 0}
                className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
