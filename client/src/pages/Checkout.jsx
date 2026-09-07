import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { CreditCard, Truck, MapPin, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

const Checkout = () => {
  const API_BASE_URL = 'http://localhost:5000/api/orders';
  const navigate = useNavigate();
  const { cart, user, token, clearCart } = useStore();
  const [loading, setLoading] = useState(false);
  
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.name || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [cityOptions, setCityOptions] = useState([]);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const shipping = subtotal > 1000 ? 0 : 50;
    const total = subtotal + tax + shipping;
    return { subtotal, tax, shipping, total };
  };

  const { subtotal, tax, shipping, total } = calculateTotals();

  const fetchPincodeDetails = async (pincode) => {
    setIsPincodeLoading(true);
    try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
      const pincodeData = response.data?.[0];
      const postOffices = pincodeData?.PostOffice || [];

      if (pincodeData?.Status !== 'Success' || postOffices.length === 0) {
        setCityOptions([]);
        setShippingInfo((prev) => ({
          ...prev,
          city: ''
        }));
        toast.error('Invalid pincode. Please enter a valid Indian pincode.');
        return;
      }

      const detectedState = postOffices[0].State || '';
      const uniqueCities = [...new Set(postOffices.map((office) => office.District).filter(Boolean))];

      setCityOptions(uniqueCities);
      setShippingInfo((prev) => ({
        ...prev,
        state: detectedState || prev.state,
        city: uniqueCities[0] || prev.city
      }));

      toast.success('Address details fetched from pincode');
    } catch (error) {
      setCityOptions([]);
      toast.error('Unable to fetch pincode details right now. Please try again.');
    } finally {
      setIsPincodeLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'pincode') {
      const sanitizedPincode = value.replace(/\D/g, '').slice(0, 6);

      setShippingInfo((prev) => ({
        ...prev,
        pincode: sanitizedPincode
      }));

      if (sanitizedPincode.length < 6) {
        setCityOptions([]);
        setShippingInfo((prev) => ({
          ...prev,
          city: ''
        }));
      }

      if (sanitizedPincode.length === 6) {
        fetchPincodeDetails(sanitizedPincode);
      }

      return;
    }

    if (name === 'state') {
      setShippingInfo((prev) => ({
        ...prev,
        state: value,
        city: ''
      }));
      setCityOptions([]);
      return;
    }

    setShippingInfo((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const required = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
    for (const field of required) {
      if (!shippingInfo[field]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    
    if (shippingInfo.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }
    
    if (shippingInfo.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return false;
    }
    
    return true;
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const createCodOrder = async () => {
    const orderData = {
      items: cart.map(item => ({
        product: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color
      })),
      shippingAddress: shippingInfo,
      payment: {
        method: 'cod'
      },
      subtotal,
      tax,
      shippingCharge: shipping,
      total
    };

    const response = await axios.post(API_BASE_URL, orderData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to place order');
    }

    clearCart();
    toast.success('Order placed successfully!');
    navigate(`/orders/${response.data.order._id}`);
  };

  const verifyAndCreatePaidOrder = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    const response = await axios.post(
      `${API_BASE_URL}/verify-payment`,
      {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          size: item.size,
          color: item.color
        })),
        shippingAddress: shippingInfo
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Payment verification failed');
    }

    clearCart();
    toast.success('Payment successful! Order placed.');
    navigate(`/orders/${response.data.orderId}`);
  };

  const createOnlineOrder = async () => {
    const orderResponse = await axios.post(
      `${API_BASE_URL}/create-razorpay-order`,
      { amount: total, currency: 'INR' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!orderResponse.data.success) {
      throw new Error(orderResponse.data.message || 'Unable to initiate online payment');
    }

    const { order, key, mockOrder } = orderResponse.data;

    if (mockOrder) {
      const proceed = window.confirm('Dummy payment mode is enabled. Click OK to mark this payment as received.');
      if (!proceed) {
        throw new Error('Dummy payment cancelled by user');
      }

      await verifyAndCreatePaidOrder({
        razorpay_order_id: order.id,
        razorpay_payment_id: `DUMMY_PAYMENT_${Date.now()}`,
        razorpay_signature: 'DUMMY_SIGNATURE'
      });
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Razorpay SDK failed to load. Check your internet connection.');
    }

    if (!order?.id || !key) {
      throw new Error('Razorpay is not configured correctly on server.');
    }

    await new Promise((resolve, reject) => {
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: 'VibeMatch',
        description: 'Order Payment',
        order_id: order.id,
        prefill: {
          name: shippingInfo.fullName,
          email: user?.email || '',
          contact: shippingInfo.phone
        },
        notes: {
          address: `${shippingInfo.addressLine1}, ${shippingInfo.city}`
        },
        theme: {
          color: '#7c3aed'
        },
        handler: async (response) => {
          try {
            await verifyAndCreatePaidOrder(response);
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled by user'))
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        reject(new Error(response.error?.description || 'Payment failed'));
      });
      paymentObject.open();
    });
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (paymentMethod === 'cod') {
        await createCodOrder();
      } else {
        await createOnlineOrder();
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-midnight py-20">
      <div className="container mx-auto px-4">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Cart
        </button>

        <h1 className="text-4xl font-bold text-white mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-6 h-6 text-violet-400" />
                <h2 className="text-2xl font-bold text-white">Shipping Information</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={shippingInfo.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                    maxLength="10"
                    className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="9876543210"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-400 mb-2">Address Line 1 *</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={shippingInfo.addressLine1}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="House No, Street Name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-400 mb-2">Address Line 2</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={shippingInfo.addressLine2}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Landmark (Optional)"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">City *</label>
                  <select
                    name="city"
                    value={shippingInfo.city}
                    onChange={handleInputChange}
                    disabled={cityOptions.length === 0}
                    className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">{cityOptions.length === 0 ? 'Enter pincode to load city' : 'Select City'}</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">State *</label>
                  <select
                    name="state"
                    value={shippingInfo.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={shippingInfo.pincode}
                    onChange={handleInputChange}
                    maxLength="6"
                    className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="400001"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {isPincodeLoading ? 'Fetching city and state from pincode...' : 'Enter 6-digit Indian pincode to auto-fill city and state'}
                  </p>
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={shippingInfo.country}
                    disabled
                    className="w-full px-4 py-2 bg-midnight border border-violet-500/30 text-gray-500 rounded-lg"
                  />
                  <p className="text-xs text-violet-300 mt-1 tracking-wide uppercase">
                    Currently delivering within India only
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-midnight border border-violet-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-violet-400" />
                <h2 className="text-2xl font-bold text-white">Payment Method</h2>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 bg-midnight border border-violet-500/30 rounded-lg cursor-pointer hover:border-violet-500 transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-violet-600"
                  />
                  <div className="flex-1">
                    <p className="text-white font-semibold">Cash on Delivery</p>
                    <p className="text-sm text-gray-400">Pay when you receive the order</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-midnight border border-violet-500/30 rounded-lg cursor-pointer hover:border-violet-500 transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-violet-600"
                  />
                  <div className="flex-1">
                    <p className="text-white font-semibold">Online Payment</p>
                    <p className="text-sm text-gray-400">UPI, Cards, Net Banking</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-midnight border border-violet-500/30 rounded-xl p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3">
                    <img
                      src={item.image || '/assets/images/placeholders/product-placeholder.jpg'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">{item.name}</p>
                      <p className="text-gray-400 text-xs">
                        {item.size} {item.color && `• ${item.color}`} • Qty: {item.quantity}
                      </p>
                      <p className="text-white text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-violet-500/30 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tax (GST 18%)</span>
                  <span className="text-white">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className="text-white">
                    {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="border-t border-violet-500/30 pt-4 mb-6">
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Processing...'
                ) : (
                  <>
                    <Truck className="w-5 h-5" />
                    Place Order
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                By placing your order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
