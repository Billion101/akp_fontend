import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSearch } from '@fortawesome/free-solid-svg-icons';
import config from '../../../../config';
import styles from '../../style/u_notification.module.css';

const UserNoti = () => {
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
            const token = localStorage.getItem('token');
            const response = await axios.get(`${config.apiUrl}/user/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotificationData(response.data);
            setFilteredNotifications(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notification data:', error);
            setError('Failed to load notifications.');
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };

    return (
        <div className={styles.container}>
            <nav className={styles.navbar}>
                <Link to="/home-user" className={styles.backButton}>
                    <FontAwesomeIcon icon={faArrowLeft} /> Back to Homepage
                </Link>
                <div className={styles.titleContainer}>
                    {loading && <span className={styles.loading}>Loading...</span>}
                    {error && <span className={styles.error}>{error}</span>}
                    {!loading && !error && <h1 className={styles.title}>Notifications</h1>}
                </div>
                <div className={styles.searchContainer}>
                    <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search"
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
                                    <th>Weight</th>
                                    <th>M3</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortCodes(entry.codes).map((code, index) => (
                                    <tr key={index}>
                                        <td style={{ color: code.color || "black" }}>{index + 1}</td>
                                        <td style={{ color: code.color || "black" }}>
                                            {highlightText(code.code, searchTerm)}
                                        </td>
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