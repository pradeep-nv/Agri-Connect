import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddProfile.scss';
import newRequest from '../../utils/newRequest';

const AddFarmerProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    region: '',
    climate: '',
    cropNames: '',
    amountOfLand: '',
    otherDetails: ''
  });
  
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await newRequest.post('/api/farmer-details', formData, {
        withCredentials: true,
      });
      setMessage('Profile added successfully! Redirecting to dashboard...');
      setError(null);
      setTimeout(() => {
        navigate('/farmer_home');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving profile');
      setMessage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-farmer-profile">
      <div className="header-nav">
        <button type="button" className="back-btn" onClick={() => navigate('/farmer_home')}>
          ← Back to Dashboard
        </button>
      </div>

      <h2>Add Farmer Profile</h2>
      <form onSubmit={handleSubmit}>
        <label>Phone:</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        <label>Address:</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <label>Region:</label>
        <input
          type="text"
          name="region"
          value={formData.region}
          onChange={handleChange}
          required
        />

        <label>Climate:</label>
        <input
          type="text"
          name="climate"
          value={formData.climate}
          onChange={handleChange}
          required
        />

        <label>Crop Names (comma-separated):</label>
        <input
          type="text"
          name="cropNames"
          value={formData.cropNames}
          onChange={handleChange}
          required
        />

        <label>Amount of Land (in acres):</label>
        <input
          type="number"
          name="amountOfLand"
          value={formData.amountOfLand}
          onChange={handleChange}
          required
        />

        <label>Other Details:</label>
        <textarea
          name="otherDetails"
          value={formData.otherDetails}
          onChange={handleChange}
        />

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Add Profile'}
          </button>
          <button 
            type="button" 
            className="cancel-btn" 
            onClick={() => navigate('/farmer_home')}
          >
            Cancel
          </button>
        </div>
      </form>
      
      {message && <p className="success-message active">{message}</p>}
      {error && <p className="error-message active">{error}</p>}
    </div>
  );
};

export default AddFarmerProfile;

