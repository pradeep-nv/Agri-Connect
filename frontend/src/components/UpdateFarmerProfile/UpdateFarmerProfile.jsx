import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import newRequest from '../../utils/newRequest.js';
import './UpdateFarmerProfile.scss';

const UpdateFarmerProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [farmerDetails, setFarmerDetails] = useState({
    phone: '',
    address: '',
    region: '',
    climate: '',
    cropNames: [],
    amountOfLand: 0,
    otherDetails: ''
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await newRequest.get('/api/farmer-details/user/profile');
        setUser(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchFarmerDetails = async () => {
      if (user._id) {
        try {
          const response = await newRequest.get(`/api/farmer-details/${user._id}`);
          if (response.data) {
            setFarmerDetails(response.data);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error fetching farmer details:', error);
          setLoading(false);
        }
      }
    };

    fetchFarmerDetails();
  }, [user._id]);

  const handleInputChange = (field, value) => {
    setFarmerDetails(prevState => ({
      ...prevState,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setErrorMessage('');
    try {
      const response = await newRequest.put(`/api/farmer-details/${user._id}`, farmerDetails);
      if (response.status === 200) {
        setSuccessMessage('Profile updated successfully! Redirecting to dashboard...');
        setTimeout(() => navigate('/farmer_home'), 1500);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage(error.response?.data?.message || 'Error updating profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="update-profile-loading">Loading...</div>;

  return (
    <div className="update-profile">
      <div className="header-nav">
        <button type="button" className="back-btn" onClick={() => navigate('/farmer_home')}>
          ← Back to Dashboard
        </button>
      </div>

      <h2>Update Farmer Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="profile-section">
          <label>
            Phone Number:
            <input
              type="text"
              value={farmerDetails.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </label>
          <label>
            Address:
            <input
              type="text"
              value={farmerDetails.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          </label>
          <label>
            Region:
            <input
              type="text"
              value={farmerDetails.region}
              onChange={(e) => handleInputChange('region', e.target.value)}
            />
          </label>
          <label>
            Climate:
            <input
              type="text"
              value={farmerDetails.climate}
              onChange={(e) => handleInputChange('climate', e.target.value)}
            />
          </label>
          <label>
            Types of Crops:
            <input
              type="text"
              value={Array.isArray(farmerDetails.cropNames) ? farmerDetails.cropNames.join(', ') : farmerDetails.cropNames}
              onChange={(e) => handleInputChange('cropNames', e.target.value.split(',').map(crop => crop.trim()))}
            />
          </label>
          <label>
            Amount of Land (acres):
            <input
              type="number"
              value={farmerDetails.amountOfLand}
              onChange={(e) => handleInputChange('amountOfLand', e.target.value)}
            />
          </label>
          <label>
            Other Details:
            <textarea
              value={farmerDetails.otherDetails}
              onChange={(e) => handleInputChange('otherDetails', e.target.value)}
            />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="updateButton" disabled={updating}>
            {updating ? 'Updating...' : 'Update Profile'}
          </button>
          <button 
            type="button" 
            className="cancelButton" 
            onClick={() => navigate('/farmer_home')}
          >
            Cancel
          </button>
        </div>

        {successMessage && <p className="success-message">{successMessage}</p>}
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </form>
    </div>
  );
};

export default UpdateFarmerProfile;
