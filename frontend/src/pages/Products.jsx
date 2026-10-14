import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { FiSliders, FiSearch } from '../components/icons';
import './Products.css';

const DEFAULT_CATEGORIES = [
  'All',
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Books',
  'Sports',
  'Beauty',
  'Toys',
  'Groceries',
];

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'All');
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  // Fetch dynamic categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/products/categories/');
        const list = res.data.results || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const names = ['All', ...list.map((c) => c.name)];
          setCategories(names);
        }
      } catch (e) {
        // Default categories remain active
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchTerm, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      if (priceRange.min) {
        params.min_price = priceRange.min;
      }
      if (priceRange.max) {
        params.max_price = priceRange.max;
      }

      // Backend route is /products/ (router.register(r'', ProductViewSet)), with fallback to /products/products/
      let res;
      try {
        res = await api.get('/products/', { params });
      } catch (err) {
        if (err.response?.status === 404) {
          res = await api.get('/products/products/', { params });
        } else {
          throw err;
        }
      }

      let items = res.data.results || res.data;
      if (!Array.isArray(items)) items = [];

      // Client-side filtering if backend didn't do full filtering
      if (minRating > 0) {
        items = items.filter(
          (p) => Number(p.rating || p.average_rating || 0) >= minRating
        );
      }

      // Sort client-side
      if (sortBy === 'price-low') {
        items.sort(
          (a, b) =>
            Number(a.discount_price || a.price) -
            Number(b.discount_price || b.price)
        );
      } else if (sortBy === 'price-high') {
        items.sort(
          (a, b) =>
            Number(b.discount_price || b.price) -
            Number(a.discount_price || a.price)
        );
      } else if (sortBy === 'newest') {
        items.sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
      } else if (sortBy === 'popular') {
        items.sort(
          (a, b) =>
            Number(b.reviews_count || b.review_count || 0) -
            Number(a.reviews_count || a.review_count || 0)
        );
      }

      setProducts(items);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPriceFilter = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="products-page">
      <div className="products-container">
        {/* Sidebar Filters */}
        <aside className="products-sidebar">
          <div className="sidebar-header">
            <FiSliders size={18} />
            <h3>Filters</h3>
          </div>

          {/* Categories */}
          <div className="filter-group">
            <h4>Category</h4>
            <div className="category-filter-list">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-filter-btn ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <h4>Price Range (₹)</h4>
            <form onSubmit={handleApplyPriceFilter} className="price-filter-form">
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, min: e.target.value })
                  }
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, max: e.target.value })
                  }
                />
              </div>
              <button type="submit" className="filter-apply-btn">
                Apply
              </button>
            </form>
          </div>

          {/* Customer Rating */}
          <div className="filter-group">
            <h4>Minimum Rating</h4>
            <div className="rating-filter-options">
              {[4, 3, 2, 1].map((stars) => (
                <label key={stars} className="rating-radio-label">
                  <input
                    type="radio"
                    name="rating-filter"
                    checked={minRating === stars}
                    onChange={() => {
                      setMinRating(stars);
                      setTimeout(fetchProducts, 50);
                    }}
                  />
                  <span>{stars} Stars & above</span>
                </label>
              ))}
              <label className="rating-radio-label">
                <input
                  type="radio"
                  name="rating-filter"
                  checked={minRating === 0}
                  onChange={() => {
                    setMinRating(0);
                    setTimeout(fetchProducts, 50);
                  }}
                />
                <span>All Ratings</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="products-main">
          {/* Top Bar with Sort & Results Count */}
          <div className="products-topbar">
            <div className="results-count">
              {searchTerm && <span>Search: "{searchTerm}" · </span>}
              <span>
                Showing <strong>{products.length}</strong> items
              </span>
            </div>

            <div className="sort-dropdown-container">
              <label htmlFor="sort-select">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="popular">Popularity</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <Loader message="Loading catalog..." />
          ) : products.length > 0 ? (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id || product.slug}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="empty-results-box">
              <FiSearch size={40} color="#9ca3af" />
              <h3>No products found</h3>
              <p>Try adjusting your category, price range, or search criteria.</p>
              <button
                className="reset-filters-btn"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchTerm('');
                  setPriceRange({ min: '', max: '' });
                  setMinRating(0);
                  setSearchParams({});
                }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Products;
