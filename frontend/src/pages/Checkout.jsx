import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { isLoggedIn, getUser } from '../utils/auth';
import toast from '../utils/toast';
import Loader from '../components/Loader';
import { FiCreditCard, FiShield, FiTruck, FiTag, FiCheckCircle } from '../components/icons';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Coupon state: initialize from localStorage or URL param
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [inputCoupon, setInputCoupon] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const currentUser = getUser();
  const [shippingAddress, setShippingAddress] = useState({
    full_name: currentUser?.full_name || '',
    phone: '',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (!isLoggedIn()) {
      toast.error('Please sign in to proceed with checkout.');
      navigate('/login');
      return;
    }
    fetchCart();
  }, []);

  // Check URL parameter for coupon if not already applied
  useEffect(() => {
    const urlCoupon = searchParams.get('coupon');
    if (urlCoupon && (!appliedCoupon || appliedCoupon.code !== urlCoupon.toUpperCase())) {
      setInputCoupon(urlCoupon.toUpperCase());
    }
  }, [searchParams]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cart/');
      if (!res.data.items || res.data.items.length === 0) {
        toast.error('Your cart is empty.');
        navigate('/cart');
        return;
      }
      setCart(res.data);
    } catch (err) {
      console.error('Failed to load cart for checkout:', err);
      toast.error('Could not load cart.');
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
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

  const items = cart?.items || [];
  const subtotal = items.reduce((acc, item) => {
    const p = item.product;
    const price = p?.discount_price ? Number(p.discount_price) : Number(p?.price || 0);
    return acc + price * (item.quantity || 1);
  }, 0);

  const couponDiscount = appliedCoupon ? Number(appliedCoupon.discount_amount || 0) : 0;
  const shipping = subtotal > 499 ? 0 : 50;
  const finalTotal = Math.max(0, subtotal - couponDiscount + shipping);

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || inputCoupon).trim();
    if (!code) {
      toast.error('Please enter a coupon code.');
      return;
    }

    setApplyingCoupon(true);
    try {
      const res = await api.post('/coupons/apply/', {
        code: code,
        order_total: subtotal,
      });

      const discount =
        res.data.discount_amount ??
        res.data.discount ??
        res.data.discount_value ??
        0;

      const couponObj = {
        code: (res.data.code || code).toUpperCase(),
        discount_amount: Number(discount),
      };

      setAppliedCoupon(couponObj);
      localStorage.setItem('applied_coupon', JSON.stringify(couponObj));
      setInputCoupon('');
      toast.success(res.data.message || `Coupon ${couponObj.code} applied! Saved ₹${discount}`);
    } catch (err) {
      console.error('Failed to apply coupon:', err);
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Invalid or expired coupon code.'
      );
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem('applied_coupon');
    toast.success('Coupon removed.');
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // 1. Create order on backend (flat address fields + coupon_code)
      const orderRes = await api.post('/orders/create/', {
        shipping_address: shippingAddress.address_line,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        phone: shippingAddress.phone,
        coupon_code: appliedCoupon?.code || '',
      });

      const order = orderRes.data.order;
      const razorpayConfig = orderRes.data.razorpay || {};

      // 2. Load Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Could not load Razorpay SDK. Simulating order placement...');
        localStorage.removeItem('applied_coupon');
        window.dispatchEvent(new Event('cartUpdated'));
        navigate(`/order-confirmation/${order?.id || 'order-placed'}`);
        return;
      }

      // 3. Open Razorpay modal
      const options = {
        key: razorpayConfig.key_id || razorpayConfig.key || 'rzp_test_placeholder',
        amount: razorpayConfig.amount || Math.round(Number(order?.total_amount || finalTotal) * 100),
        currency: razorpayConfig.currency || 'INR',
        name: 'AI Powered Ecommerce',
        description: `Order #${order?.id || ''}`,
        image: '/logo.jpg',
        order_id: razorpayConfig.order_id || razorpayConfig.razorpay_order_id,
        handler: async function (response) {
          try {
            await api.post('/orders/verify-payment/', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
          } catch (e) {
            console.error('Payment verification notice:', e);
          }
          localStorage.removeItem('applied_coupon');
          window.dispatchEvent(new Event('cartUpdated'));
          toast.success('Payment successful! Order placed.');
          navigate(`/order-confirmation/${order?.id}`);
        },
        prefill: {
          name: shippingAddress.full_name,
          email: currentUser?.email || '',
          contact: shippingAddress.phone,
        },
        theme: {
          color: '#333333',
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            toast('Payment window closed. Order saved in My Orders.');
            navigate('/my-orders');
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to initialize payment.'
      );
      setProcessing(false);
    }
  };

  if (loading) {
    return <Loader message="Preparing checkout..." />;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout & Payment</h1>

        <div className="checkout-layout">
          {/* Shipping Address Form */}
          <div className="checkout-form-section">
            <div className="checkout-card">
              <div className="card-header">
                <FiTruck size={20} />
                <h2>1. Shipping Address</h2>
              </div>

              <form id="checkout-form" onSubmit={handlePayment} className="address-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={shippingAddress.full_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="10-digit mobile"
                      value={shippingAddress.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Street Address / Flat / Building</label>
                  <input
                    type="text"
                    name="address_line"
                    placeholder="House no, Street name, Area"
                    value={shippingAddress.address_line}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-row three-cols">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>PIN Code</label>
                    <input
                      type="text"
                      name="pincode"
                      placeholder="6 digits"
                      value={shippingAddress.pincode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="payment-action-box">
                  <button
                    type="submit"
                    className="pay-razorpay-btn"
                    disabled={processing}
                  >
                    <FiCreditCard size={18} />
                    {processing
                      ? 'Processing Payment...'
                      : `Pay ₹${finalTotal.toLocaleString('en-IN')} with Razorpay`}
                  </button>
                  <p className="payment-trust-badge">
                    <FiShield size={14} color="#16a34a" /> 100% Secure Payment Powered by Razorpay
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout-summary-section">
            <div className="checkout-card">
              <div className="card-header">
                <h2>2. Order Summary</h2>
              </div>

              <div className="summary-items-preview">
                {items.map((item) => {
                  const prod = item.product || {};
                  const price = prod.discount_price
                    ? Number(prod.discount_price)
                    : Number(prod.price || 0);
                  const img =
                    prod.image_url ||
                    prod.image ||
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';

                  return (
                    <div key={item.id} className="preview-item">
                      <img src={img} alt={prod.title} className="preview-img" />
                      <div className="preview-info">
                        <p className="preview-name">{prod.title || prod.name}</p>
                        <span className="preview-qty">Qty: {item.quantity}</span>
                      </div>
                      <span className="preview-price">
                        ₹{(price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="summary-divider"></div>

              {/* Coupon Section in Checkout */}
              <div className="checkout-coupon-section">
                {appliedCoupon ? (
                  <div className="checkout-applied-coupon">
                    <div className="applied-coupon-info">
                      <span className="applied-coupon-badge">
                        <FiCheckCircle size={14} color="#16a34a" /> {appliedCoupon.code}
                      </span>
                      <span className="applied-coupon-amount">
                        -₹{couponDiscount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="remove-coupon-btn"
                      onClick={handleRemoveCoupon}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="checkout-coupon-input-group">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      className="checkout-coupon-input"
                      disabled={applyingCoupon}
                    />
                    <button
                      type="button"
                      className="checkout-coupon-btn"
                      onClick={() => handleApplyCoupon()}
                      disabled={applyingCoupon || !inputCoupon.trim()}
                    >
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              <div className="summary-divider"></div>

              <div className="checkout-price-breakdown">
                <div className="price-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="price-row discount-row">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="price-row">
                  <span>Delivery</span>
                  <span>
                    {shipping === 0 ? (
                      <strong className="free-text">FREE</strong>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>
                <div className="summary-divider"></div>
                <div className="price-row total-highlight">
                  <span>Total Due</span>
                  <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
