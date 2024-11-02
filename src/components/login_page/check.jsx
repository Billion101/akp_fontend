import React, { useState } from 'react';
import axios from 'axios';
import styles from './check.module.css';

const CheckCode = () => {
  const [productCode, setProductCode] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCheckTracking = async () => {
    try {
      const response = await axios.get(`https://logistics.gaobat.com/api/tracking/${productCode}`);
      setTrackingData(response.data); // assuming response.data contains tracking info
      setErrorMessage('');
    } catch (error) {
      if (error.response) {
        setErrorMessage('Unable to retrieve tracking data. Please check the product code and try again.');
      } else {
        setErrorMessage('Network error. Please try again later.');
      }
      setTrackingData(null);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Track Your Product</h2>
      <div className={styles.inputGroup}>
        <input
          type="text"
          placeholder="Enter Product Code"
          value={productCode}
          onChange={(e) => setProductCode(e.target.value)}
          className={styles.input}
        />
        <button onClick={handleCheckTracking} className={styles.trackButton}>
          Check Tracking
        </button>
      </div>
      {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
      {trackingData && (
        <div className={styles.trackingInfo}>
          <h3>Tracking Information</h3>
          <p><strong>Status:</strong> {trackingData.status}</p>
          <p><strong>Location:</strong> {trackingData.location}</p>
          <p><strong>Last Updated:</strong> {trackingData.lastUpdated}</p>
          {/* Adjust fields based on actual response structure */}
        </div>
      )}
    </div>
  );
};

export default CheckCode;
