import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import Loader from '../components/Loader';
import { FiCheckCircle, FiPackage, FiArrowRight } from '../components/icons';

function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}/`);
        setOrder(res.data);
      } catch (err) {
        console.error('Failed to load order info:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id && id !== 'order-placed') {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return <Loader message="Fetching order details..." />;
  }

  return (
    <div style={{ maxWidth: '680px', margin: '48px auto 80px', padding: '0 24px' }}>
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          padding: '48px 36px',
          textAlign: 'center',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <FiCheckCircle size={44} color="#16a34a" />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
          Order Placed Successfully!
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '24px' }}>
          Thank you for your purchase. We are getting your order ready to ship.
        </p>

        <div
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            padding: '16px 24px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-around',
            marginBottom: '32px',
          }}
        >
          <div>
            <span style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block' }}>Order ID</span>
            <strong style={{ fontSize: '0.95rem', color: '#111827' }}>#{id}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block' }}>Payment Status</span>
            <strong style={{ fontSize: '0.95rem', color: '#16a34a' }}>Confirmed</strong>
          </div>
          {order?.total_amount && (
            <div>
              <span style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block' }}>Total Paid</span>
              <strong style={{ fontSize: '0.95rem', color: '#111827' }}>
                ₹{Number(order.total_amount).toLocaleString('en-IN')}
              </strong>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            to="/my-orders"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 22px',
              borderRadius: '8px',
              fontSize: '0.92rem',
              fontWeight: 600,
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
              border: '1px solid #d1d5db',
            }}
          >
            <FiPackage size={16} /> View Orders
          </Link>

          <Link
            to="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 24px',
              borderRadius: '8px',
              fontSize: '0.92rem',
              fontWeight: 600,
              backgroundColor: '#333333',
              color: '#ffffff',
            }}
          >
            Continue Shopping <FiArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;
