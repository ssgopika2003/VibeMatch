import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Package, Truck, CheckCircle, ArrowLeft, MapPin, Star, AlertCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token } = useStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const cancelReasons = [
    'Price is too high',
    'Found a better deal elsewhere',
    'Changed my mind',
    'Ordered by mistake',
    'Delivery time is too long',
    'Other'
  ];

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const canCancelOrder = (order) => {
    return ['placed', 'processing'].includes(order.status);
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    if (order.status === 'shipped') {
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
        `http://localhost:5000/api/orders/${order._id}/cancel`,
        { reason: finalReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
      setCancelReason('');
      setCustomReason('');
      fetchOrderDetails(); // Refresh order details
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      placed: 'text-blue-400',
      processing: 'text-yellow-400',
      shipped: 'text-purple-400',
      delivered: 'text-green-400',
      cancelled: 'text-red-400',
      returned: 'text-orange-400'
    };
    return colors[status] || 'text-gray-400';
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'placed', label: 'Order Placed', icon: Package },
      { key: 'processing', label: 'Processing', icon: Package },
      { key: 'shipped', label: 'Shipped', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle }
    ];

    const statusOrder = ['placed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(order?.status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex
    }));
  };

  const handleRateProduct = (product) => {
    setSelectedProduct(product);
    setRating(5);
    setReview('');
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (!selectedProduct) return;

    try {
      await axios.post(
        `http://localhost:5000/api/products/${selectedProduct.product}/reviews`,
        {
          rating,
          comment: review
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Review submitted successfully!');
      setShowRatingModal(false);
      fetchOrderDetails();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-white text-xl">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Order not found</p>
          <button
            onClick={() => navigate('/orders')}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg transition"
          >
            View All Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight py-20">
      <div className="container mx-auto px-4">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Orders
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Order #{order.orderNumber}
                  </h1>
                  <p className="text-gray-400">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {canCancelOrder(order) && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-500/30 hover:bg-red-600/20 text-red-400 rounded-lg transition"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel
                    </button>
                  )}
                  <div className={`px-4 py-2 rounded-lg bg-midnight border border-violet-500/30 ${getStatusColor(order.status)} font-semibold capitalize`}>
                    {order.status}
                  </div>
                </div>
              </div>

              {/* Order Status Timeline */}
              <div className="relative pt-8">
                <div className="flex justify-between">
                  {getStatusSteps().map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1">
                        {/* Line */}
                        {index > 0 && (
                          <div className={`absolute top-10 h-1 ${step.completed ? 'bg-violet-600' : 'bg-gray-700'}`}
                            style={{
                              left: `${(index - 1) * 33.33 + 16.66}%`,
                              width: '33.33%',
                              transform: 'translateY(-50%)'
                            }}
                          />
                        )}
                        
                        {/* Icon */}
                        <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                          step.completed ? 'bg-violet-600 text-white' : 'bg-gray-700 text-gray-400'
                        } ${step.active ? 'ring-4 ring-violet-600/30' : ''}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        
                        {/* Label */}
                        <p className={`mt-2 text-sm text-center ${step.completed ? 'text-white' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        
                        {/* Timeline entry */}
                        {order.timeline && order.timeline.find(t => t.status === step.key) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.timeline.find(t => t.status === step.key).timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-midnight border border-violet-500/20 rounded-lg">
                    <img
                      src={item.image || '/assets/images/placeholders/product-placeholder.jpg'}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">{item.name}</h3>
                      <div className="flex gap-4 text-sm text-gray-400 mb-2">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                        <span>Qty: {item.quantity}</span>
                      </div>
                      <p className="text-white font-semibold">₹{item.price.toFixed(2)}</p>
                    </div>
                    
                    {order.status === 'delivered' && (
                      <button
                        onClick={() => handleRateProduct(item)}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition h-fit"
                      >
                        <Star className="w-4 h-4" />
                        Rate
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-violet-400" />
                <h2 className="text-2xl font-bold text-white">Shipping Address</h2>
              </div>
              <div className="text-gray-300">
                <p className="font-semibold text-white mb-2">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-midnight border border-violet-500/30 rounded-xl p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">₹{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tax (GST)</span>
                  <span className="text-white">₹{order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className="text-white">
                    {order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge.toFixed(2)}`}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-₹{order.discount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-violet-500/30 pt-4 mb-6">
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Total</span>
                  <span>₹{order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-violet-500/30 pt-4">
                <h3 className="text-white font-semibold mb-3">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Method</span>
                    <span className="text-white capitalize">{order.payment.method}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Status</span>
                    <span className={`capitalize ${
                      order.payment.status === 'completed' ? 'text-green-400' :
                      order.payment.status === 'pending' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {order.payment.status}
                    </span>
                  </div>
                </div>
              </div>

              {order.tracking?.trackingNumber && (
                <div className="border-t border-violet-500/30 pt-4 mt-4">
                  <h3 className="text-white font-semibold mb-3">Tracking Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="text-gray-400">
                      <span className="block">Tracking Number</span>
                      <span className="text-white font-mono">{order.tracking.trackingNumber}</span>
                    </div>
                    {order.tracking.courier && (
                      <div className="text-gray-400">
                        <span className="block">Courier</span>
                        <span className="text-white">{order.tracking.courier}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-midnight border border-violet-500/30 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Rate Product</h2>
            
            <p className="text-gray-400 mb-4">{selectedProduct?.name}</p>
            
            <div className="mb-6">
              <label className="block text-gray-400 mb-3">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition"
                  >
                    <Star
                      className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-400 mb-2">Review (Optional)</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Share your experience with this product..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && order && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-midnight border border-violet-500/30 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-bold text-white">Cancel Order</h3>
            </div>
            
            <p className="text-gray-400 mb-4">
              Are you sure you want to cancel Order #{order.orderNumber}?
            </p>

            <div className="mb-4">
              <label className="block text-white font-semibold mb-2">
                Reason for cancellation <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {cancelReasons.map((reason) => (
                  <label key={reason} className="flex items-center gap-2 text-gray-300 cursor-pointer hover:text-white transition">
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason}
                      checked={cancelReason === reason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-4 h-4 text-violet-500 focus:ring-violet-500"
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
                className="w-full bg-midnight border border-violet-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 mb-4"
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
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={!cancelReason.trim() || (cancelReason === 'Other' && !customReason.trim())}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
