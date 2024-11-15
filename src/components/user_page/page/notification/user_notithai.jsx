import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSearch } from "@fortawesome/free-solid-svg-icons";
import config from "../../../../config";
import styles from "../../style/u_notification.module.css";

const UserNotiThai = () => {
  const [notificationData, setNotificationData] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeout = useRef();

  useEffect(() => {
    fetchNotificationData();
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const fetchNotificationData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${config.apiUrl}/user/notificationsThai`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotificationData(response.data);
      setFilteredNotifications(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching notification data:", error);
      setError("Failed to load notifications.");
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const filtered = notificationData.filter((entry) => {
        const dateMatch = formatDate(entry.createdAt).toLowerCase().includes(value);
        const codeMatch = entry.codes.some((code) => 
          code.code.toLowerCase().includes(value)
        );
        return dateMatch || codeMatch;
      });
      setFilteredNotifications(filtered);
    }, 300);
  };

  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;
    
    const parts = text.toString().split(new RegExp(`(${searchTerm})`, 'gi'));
    
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={index} className={styles.highlightedText}>
          {part}
        </span>
      ) : part
    );
  };

  const formatPrice = (price) => {
    if (!price) return "0.00 ";
    const formattedPrice = price
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formattedPrice}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <Link to="/home-user" className={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Homepage
        </Link>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>Notifications Thai</h1>
        </div>
        <div className={styles.searchContainer}>
          <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by code or date (dd/mm/yyyy)..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>
      </nav>
      <div className={styles.entriesSection}>
        {filteredNotifications.length === 0 && !loading && (
          <div className={styles.noData}>No notifications available.</div>
        )}
        {filteredNotifications.map((entry) => (
          <div key={entry.id} className={styles.entryCard}>
            <p>
              <strong>ເຄື່ອງເຂົ້າວັນທີ:</strong>{' '}
              {highlightText(formatDate(entry.createdAt), searchTerm)}
            </p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Code</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {entry.codes.map((code, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{highlightText(code.code, searchTerm)}</td>
                    <td>{code.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.entryTotals}>
              <p>
                Total Price: {`${formatPrice(entry.totalPrice)}Kip`} | Total
                Thai Price: {`${formatPrice(entry.totalPrices)}Baht`}
              </p>
            </div>
            <hr />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserNotiThai;