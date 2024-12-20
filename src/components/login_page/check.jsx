import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './check.module.css';

const CheckCode = () => {
  const [productCode, setProductCode] = useState('');
  const [trackingData, setTrackingData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPopup, setShowPopup] = useState(true); // For popup control
  const navigate = useNavigate(); // To navigate to other routes

  const handleCheckTracking = async () => {
    try {
      const response = await axios.get(`https://logistics.gaobat.com/api/tracking/${productCode}`);
      const trackingInfo = response.data;

      if (trackingInfo && trackingInfo.events && trackingInfo.events.length > 0) {
        setTrackingData(trackingInfo.events);
        setErrorMessage('');
      } else {
        setTrackingData([]);
        setErrorMessage('No tracking information found for this product code.');
      }
    } catch (error) {
      setTrackingData([]);
      setErrorMessage('An error occurred while fetching tracking data.');
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    navigate('/'); // Navigate to the home route
  };

  return (
    <div className={styles.container}>
      {showPopup && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <h3>ຂໍອະໄພ!!</h3>
            <p>ຟັງຊັ່ນນີ້ຍັງບໍສາມາດໃຊ້ໄດ້!!</p>
            <button onClick={handleClosePopup} className={styles.backButton}>
              Back to Home
            </button>
          </div>
        </div>
      )}
      {!showPopup && (
        <>
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
          {trackingData.length > 0 && (
            <div className={styles.timeline}>
              {trackingData.map((event, index) => (
                <div key={index} className={styles.timelineItem}>
                  <div className={styles.timelineTime}>{event.date}</div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineStatus}>{event.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CheckCode;
