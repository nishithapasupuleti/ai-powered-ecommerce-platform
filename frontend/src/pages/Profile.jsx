import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { isLoggedIn, getUser } from '../utils/auth';
import toast from '../utils/toast';
import Loader from '../components/Loader';
import { FiUser } from '../components/icons';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: '',
  });

  useEffect(() => {
    if (!isLoggedIn()) {
      toast.error('Please sign in to view your profile.');
      navigate('/login');
      return;
    }

    const loadProfile = async () => {
      try {
        const user = getUser();
        if (user) {
          setFormData({
            full_name: user.full_name || '',
            email: user.email || '',
            role: user.role || 'customer',
          });
        }
        // Also fetch fresh user profile from backend
        const res = await api.get('/auth/user/');
        if (res.data) {
          setFormData({
            full_name: res.data.full_name || '',
            email: res.data.email || '',
            role: res.data.role || 'customer',
          });
          localStorage.setItem('user', JSON.stringify(res.data));
        }
      } catch (err) {
        // Fallback to local user
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/auth/user/', {
        full_name: formData.full_name,
      });
      const updated = res.data;
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('authChange'));
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader message="Loading profile..." />;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header-card">
          <div className="profile-avatar">
            <FiUser size={36} />
          </div>
          <div className="profile-header-info">
            <h2>{formData.full_name || 'Valued User'}</h2>
            <p>{formData.email}</p>
            <span className="profile-role-tag">{formData.role}</span>
          </div>
        </div>

        <div className="profile-card">
          <h3 className="profile-card-title">Personal Information</h3>
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="disabled-input"
              />
              <span className="field-hint">Email address cannot be changed.</span>
            </div>

            <div className="form-group">
              <label>Account Role</label>
              <input
                type="text"
                value={formData.role.toUpperCase()}
                disabled
                className="disabled-input"
              />
            </div>

            <button type="submit" className="save-profile-btn" disabled={saving}>
              {saving ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
