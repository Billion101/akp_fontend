import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import config from '../../../../config';
import styles from '../../style/u_notification.module.css';
const UserNoti = () => {
    const [notificationData, setNotificationData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotificationData();
    }, []);

    const fetchNotificationData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${config.apiUrl}/user/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotificationData(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notification data:', error);
            setError('Failed to load notifications.');
            setLoading(false);
        }
    };

    const sortCodes = (codes) => {
        return [...codes].sort((a, b) => {
            if (a.weight && !b.weight) return -1;
            if (!a.weight && b.weight) return 1;
            if (a.m3 && !b.m3) return 1;
            if (!a.m3 && b.m3) return -1;
            return 0;
        });
    };

    const formatPrice = (price) => {
        if (!price) return "0.00 Kip";
        const formattedPrice = price
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `${formattedPrice} Kip`;
    };

    // Date formatting function
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 to month because it is 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
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
                <h1 className={styles.title}>Notifications chainese</h1>
                </div>
            </nav>
           <div className={styles.entriesSection}>
                {notificationData.map((entry) => (
                    <div key={entry.id} className={styles.entryCard}>
                        <p><strong>ເຄື່ອງເຂົ້າວັນທີ:</strong> {formatDate(entry.createdAt)}</p>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Code</th>
                                    <th>Weight</th>
                                    <th>M3</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortCodes(entry.codes).map((code, index) => (
                                    <tr key={index}>
                                        <td style={{ color: code.color || "black" }}>{index + 1}</td>
                                        <td style={{ color: code.color || "black" }}>{code.code}</td>
                                        <td style={{ color: code.color || "black" }}>
                                            {code.weight ? `${code.weight} kg` : ""}
                                        </td>
                                        <td style={{ color: code.color || "black" }}>
                                            {code.m3 ? `${code.m3} m³` : ""}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className={styles.entryTotals}>
                            <p>
                                Total Price: {formatPrice(entry.totalPrice)} | Total Weight:{" "}
                                {entry.totalWeight} | Total M3: {entry.totalM3}
                            </p>
                        </div>
                        <hr/>
                    </div>
                ))}
            </div>
           </div>
    );
};

export default UserNoti;
