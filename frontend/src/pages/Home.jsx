import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { isLoggedIn } from '../utils/auth';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { FiArrowRight, FiSparkles, FiTrendingUp, FiTag, FiCpu } from '../components/icons';
import './Home.css';

const DEFAULT_CATEGORIES = [
  { name: 'Electronics', icon: '💻', slug: 'electronics' },
  { name: 'Fashion', icon: '👕', slug: 'fashion' },
  { name: 'Home & Kitchen', icon: '🏠', slug: 'home-kitchen' },
  { name: 'Books', icon: '📚', slug: 'books' },
  { name: 'Sports', icon: '⚽', slug: 'sports' },
  { name: 'Beauty', icon: '💄', slug: 'beauty' },
  { name: 'Toys', icon: '🧸', slug: 'toys' },
  { name: 'Groceries', icon: '🛒', slug: 'groceries' },
];

function Home() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [forYouProducts, setForYouProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [dealProducts, setDealProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      // 1. Fetch catalog products (handle both /products/ and /products/products/ gracefully)
      let catalog = [];
      try {
        const prodRes = await api.get('/products/');
        catalog = prodRes.data.results || prodRes.data || [];
      } catch (err) {
        try {
          const fallbackRes = await api.get('/products/products/');
          catalog = fallbackRes.data.results || fallbackRes.data || [];
        } catch (err2) {
          catalog = [];
        }
      }
      if (!Array.isArray(catalog)) catalog = [];

      // 2. Fetch categories from /products/categories/
      try {
        const catRes = await api.get('/products/categories/');
        const catData = catRes.data.results || catRes.data || [];
        if (Array.isArray(catData) && catData.length > 0) {
          const iconMap = {
            electronics: '💻',
            fashion: '👕',
            'home-kitchen': '🏠',
            books: '📚',
            sports: '🏃',
            beauty: '✨',
            toys: '🧸',
            groceries: '🛒',
          };
          const formatted = catData.map((c) => {
            const slug = c.slug || c.name.toLowerCase().replace(/\s+/g, '-');
            return {
              name: c.name,
              slug: slug,
              icon: iconMap[slug] || '🛍️',
            };
          });
          setCategories(formatted);
        }
      } catch (catErr) {
        // Fall back to DEFAULT_CATEGORIES
      }

      // 3. Fetch trending recommendations (handle 401 or failure gracefully)
      let trendingList = [];
      try {
        const trendRes = await api.get('/recommendations/trending/');
        const trendData = trendRes.data.results || trendRes.data || [];
        if (Array.isArray(trendData) && trendData.length > 0) {
          trendingList = trendData;
        }
      } catch (trendErr) {
        // Trending fallback to catalog products
      }
      if (trendingList.length === 0) {
        trendingList = catalog.slice(0, 8);
      }
      setTrendingProducts(trendingList.slice(0, 8));

      // 4. Fetch personalized recommendations ("for-you")
      let forYouList = [];
      if (isLoggedIn()) {
        try {
          const recRes = await api.get('/recommendations/for-you/');
          const recData = recRes.data.results || recRes.data || [];
          if (Array.isArray(recData) && recData.length > 0) {
            forYouList = recData;
          }
        } catch (recErr) {
          // If 401 or failed, gracefully fall back to trending
        }
      }
      // If not logged in or personalized is empty, fallback to trending or catalog
      if (forYouList.length === 0) {
        forYouList = trendingList.length > 0 ? trendingList : catalog.slice(0, 8);
      }
      setForYouProducts(forYouList.slice(0, 8));

      // 5. Deal of the day: discounted products
      const deals = catalog.filter(
        (p) => p.discount_price && Number(p.discount_price) < Number(p.price)
      );
      setDealProducts(deals.length > 0 ? deals.slice(0, 8) : catalog.slice(0, 8));
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-banner">
        <div className="hero-content">
          <div className="hero-badge">
            <FiCpu size={16} />
            <span>AI-Driven Personalization</span>
          </div>
          <h1 className="hero-title">
            Discover products curated by AI, <br />
            <span className="hero-title-highlight">just for you</span>
          </h1>
          <p className="hero-description">
            Experience an intelligent store that learns your preferences, predicts your needs, and surfaces the best deals in real time.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="hero-btn-primary">
              Start Shopping <FiArrowRight size={18} />
            </Link>
            <a href="#trending" className="hero-btn-secondary">
              Explore Trending
            </a>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="home-section categories-section">
        <div className="section-header">
          <h2 className="section-title">Shop by Category</h2>
          <Link to="/products" className="view-all-link">
            All Categories <FiArrowRight size={14} />
          </Link>
        </div>
        <div className="category-grid">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="category-card"
            >
              <div className="category-icon">{cat.icon}</div>
              <span className="category-name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {loading ? (
        <Loader message="Curating personalized collections..." />
      ) : (
        <>
          {/* Just For You Section */}
          <section className="home-section">
            <div className="section-header">
              <div className="title-with-badge">
                <FiSparkles className="section-icon sparkles-color" size={20} />
                <h2 className="section-title">
                  {isLoggedIn() ? 'Recommended Just For You' : 'AI Handpicked Essentials'}
                </h2>
              </div>
              <Link to="/products" className="view-all-link">
                View All <FiArrowRight size={14} />
              </Link>
            </div>
            {forYouProducts.length > 0 ? (
              <div className="horizontal-product-scroll">
                {forYouProducts.map((product) => (
                  <div key={product.id || product.slug} className="scroll-product-item">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-section-card">
                <p>Browse products to help our AI learn your taste!</p>
                <Link to="/products" className="browse-now-btn">Start Browsing</Link>
              </div>
            )}
          </section>

          {/* Deal of the Day */}
          <section className="home-section">
            <div className="section-header">
              <div className="title-with-badge">
                <FiTag className="section-icon deal-color" size={20} />
                <h2 className="section-title">Deal of the Day</h2>
              </div>
              <Link to="/products" className="view-all-link">
                All Deals <FiArrowRight size={14} />
              </Link>
            </div>
            {dealProducts.length > 0 ? (
              <div className="horizontal-product-scroll">
                {dealProducts.map((product) => (
                  <div key={product.id || product.slug} className="scroll-product-item">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-section-card">
                <p>Check back later for exclusive limited-time deals!</p>
              </div>
            )}
          </section>

          {/* Trending Now Section */}
          <section id="trending" className="home-section">
            <div className="section-header">
              <div className="title-with-badge">
                <FiTrendingUp className="section-icon trending-color" size={20} />
                <h2 className="section-title">Trending Now</h2>
              </div>
              <Link to="/products" className="view-all-link">
                Explore More <FiArrowRight size={14} />
              </Link>
            </div>
            {trendingProducts.length > 0 ? (
              <div className="horizontal-product-scroll">
                {trendingProducts.map((product) => (
                  <div key={product.id || product.slug} className="scroll-product-item">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-section-card">
                <p>No trending items right now. Be the first to start shopping!</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Home;
