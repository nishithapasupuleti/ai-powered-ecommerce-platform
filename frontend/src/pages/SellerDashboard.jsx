import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { isLoggedIn, isSeller } from '../utils/auth';
import toast from '../utils/toast';
import Loader from '../components/Loader';
import { FiPlus, FiTrash2, FiEdit, FiPackage, FiCheckCircle } from '../components/icons';
import './SellerDashboard.css';

function SellerDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: 'Electronics',
    price: '',
    discount_price: '',
    stock: 10,
    description: '',
    image_url: '',
  });

  useEffect(() => {
    if (!isLoggedIn()) {
      toast.error('Please sign in first.');
      navigate('/login');
      return;
    }
    if (!isSeller()) {
      toast.error('Access restricted to Seller accounts.');
      navigate('/');
      return;
    }
    fetchSellerProducts();
  }, []);

  const fetchSellerProducts = async () => {
    setLoading(true);
    try {
      // In Django backend, this endpoint returns seller's products
      const res = await api.get('/seller/products/');
      const data = res.data.results || res.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      // Fallback: fetch all products and show
      try {
        const fallback = await api.get('/products/');
        const data = fallback.data.results || fallback.data;
        setProducts(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch (e) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      title: '',
      category: 'Electronics',
      price: '',
      discount_price: '',
      stock: 10,
      description: '',
      image_url: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setForm({
      title: p.title || p.name || '',
      category: typeof p.category === 'object' ? p.category.name : (p.category || 'Electronics'),
      price: p.price || '',
      discount_price: p.discount_price || '',
      stock: p.stock ?? 10,
      description: p.description || '',
      image_url: p.image_url || p.image || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/seller/products/${id}/`);
      toast.success('Product deleted successfully.');
      fetchSellerProducts();
    } catch (err) {
      // If endpoint doesn't exist, try /products/id/
      try {
        await api.delete(`/products/${id}/`);
        toast.success('Product deleted.');
        fetchSellerProducts();
      } catch (e) {
        toast.error('Failed to delete product.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProduct) {
        await api.patch(`/seller/products/${editingProduct.id}/`, form);
        toast.success('Product updated successfully!');
      } else {
        await api.post('/seller/products/', form);
        toast.success('Product created successfully!');
      }
      setShowModal(false);
      fetchSellerProducts();
    } catch (err) {
      // Fallback post to /products/
      try {
        if (editingProduct) {
          await api.patch(`/products/${editingProduct.id}/`, form);
        } else {
          await api.post('/products/', form);
        }
        toast.success('Product saved successfully!');
        setShowModal(false);
        fetchSellerProducts();
      } catch (e) {
        toast.error(err.response?.data?.message || 'Failed to save product.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader message="Loading seller portal..." />;
  }

  const totalInventory = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalValue = products.reduce((acc, p) => acc + (Number(p.price || 0) * (p.stock || 1)), 0);

  return (
    <div className="seller-page">
      <div className="seller-container">
        {/* Top Header */}
        <div className="seller-header">
          <div>
            <h1 className="seller-title">Seller Management Dashboard</h1>
            <p className="seller-subtitle">Manage products, inventory, and track listings.</p>
          </div>
          <button className="add-product-btn" onClick={handleOpenAdd}>
            <FiPlus size={18} /> Add New Product
          </button>
        </div>

        {/* Stats Row */}
        <div className="seller-stats-grid">
          <div className="seller-stat-card">
            <span className="stat-label">Active Listings</span>
            <strong className="stat-value">{products.length}</strong>
          </div>
          <div className="seller-stat-card">
            <span className="stat-label">Total Inventory Units</span>
            <strong className="stat-value">{totalInventory}</strong>
          </div>
          <div className="seller-stat-card">
            <span className="stat-label">Catalog Value</span>
            <strong className="stat-value">₹{totalValue.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Products Table */}
        <div className="seller-table-card">
          <h2 className="table-title">Your Products</h2>

          {products.length === 0 ? (
            <div className="empty-seller-box">
              <FiPackage size={40} color="#9ca3af" />
              <h3>No products listed yet</h3>
              <p>Click "Add New Product" to list your first item for sale.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const img = p.image_url || p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="prod-cell">
                            <img src={img} alt="" className="prod-cell-img" />
                            <div className="prod-cell-info">
                              <span className="prod-cell-title">{p.title || p.name}</span>
                              <span className="prod-cell-id">ID: #{p.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>{typeof p.category === 'object' ? p.category.name : p.category}</td>
                        <td>
                          <div className="prod-price-cell">
                            <strong>₹{Number(p.discount_price || p.price).toLocaleString('en-IN')}</strong>
                            {p.discount_price && <del>₹{Number(p.price).toLocaleString('en-IN')}</del>}
                          </div>
                        </td>
                        <td>
                          <span className={p.stock > 0 ? 'stock-ok' : 'stock-out'}>
                            {p.stock} units
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
                            <button
                              className="action-btn edit-btn"
                              title="Edit"
                              onClick={() => handleOpenEdit(p)}
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              className="action-btn delete-btn"
                              title="Delete"
                              onClick={() => handleDelete(p.id)}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Product Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Home & Living">Home & Living</option>
                      <option value="Beauty & Health">Beauty & Health</option>
                      <option value="Sports & Fitness">Sports & Fitness</option>
                      <option value="Books & Media">Books & Media</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Stock Count</label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Regular Price (₹)</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Discount Price (₹, Optional)</label>
                    <input
                      type="number"
                      value={form.discount_price}
                      onChange={(e) => setForm({ ...form, discount_price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-save-btn"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Listing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerDashboard;
