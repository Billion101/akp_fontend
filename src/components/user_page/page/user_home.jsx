import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../style/u_home.module.css';
import config from '../../../config';
import akp_icon from '../../../assets/akp-box.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBell } from '@fortawesome/free-solid-svg-icons'; 

const UserHome = () => {
    const navigate = useNavigate();
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState([]);
    const token = localStorage.getItem('token');
    const [showModal, setShowModal] = useState(false);
    const [selectedDayId, setSelectedDayId] = useState(null); 
    const [clickedNote, setClickedNote] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const handleClick = (id) => {
        setClickedNote(id);
    };

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/');
    }, [navigate]);

    useEffect(() => {
        // Fetch existing notes when the component mounts
        axios.get(`${config.apiUrl}/user/getUserDay`, {
            headers: {
                Authorization: `Bearer ${token}`, // Use the correct token from localStorage
            },
        })
            .then(response => {
                setNotes(response.data);
            })
            .catch(error => {
                console.error('There was an error fetching the days!', error);
            });
    }, [token]);

    const fetchNotifications = useCallback(() => {
        axios.get(`${config.apiUrl}/user/getNotiFormAdmin`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then(response => {
            setNotifications(response.data);
        })
        .catch(error => {
            console.error('Error fetching notifications:', error);
        });
    }, [token]);
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
    };

    const addDay = () => {
        if (!date) {
            alert('Please select a date.');
            return;
        }

        axios.post(`${config.apiUrl}/user/addUserDay`, { date }, {
            headers: {
                Authorization: `Bearer ${token}`, // Use the correct token from localStorage
            },
        })
            .then(response => {
                setNotes([...notes, { id: response.data.dayId, date }]);
                setDate(''); // Clear the input
            })
            .catch(error => {
                console.error('There was an error adding the day!', error);
            });
    };

    const handleDelete = (dayId) => {
        setSelectedDayId(dayId);
        setShowModal(true);  // Show confirmation modal
    };

    const confirmDelete = () => {
        if (selectedDayId) {
            axios.delete(`${config.apiUrl}/user/deleteUserDay/${selectedDayId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(() => {
                setNotes(notes.filter(note => note.id !== selectedDayId));
                setShowModal(false);  // Close the modal after deletion
                setSelectedDayId(null);  // Reset selected day ID
            })
            .catch(error => {
                console.error('There was an error deleting the day!', error);
            });
        }
    };

    const cancelDelete = () => {
        setSelectedDayId(null);
        setShowModal(false);  // Close the modal without deleting
    };

    return (
        <div className={styles.container}>
           <nav className={styles.navbar}>
                <div className={styles.logoName}>
                    <FontAwesomeIcon icon={faUser} className={styles.icon} />
                    <h2 className={styles.navbarTitle}>User Page</h2>
                </div>
                <div className={styles.notificationIcon} onClick={toggleNotifications}>
                    <FontAwesomeIcon icon={faBell} />
                    {notifications.length > 0 && <span className={styles.notificationBadge}>{notifications.length}</span>}
                </div>
                <button onClick={handleLogout} className={`${styles.button} ${styles.logoutButton}`}>Logout</button>
            </nav>

            <main className={styles.main}>
                <div className={styles.addNoteSection}>
                    <h2 className={styles.addNoteTitle}>Add New Day</h2>
                    <div className={styles.addNoteForm}>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className={styles.dateInput}
                        />
                        <button onClick={addDay} className={styles.addButton}>Add Day</button>
                    </div>
                </div>

                <div className={styles.notesGrid}>
    {notes.map((note) => (
        <div
            key={note.id}
            className={`${styles.noteCard} ${clickedNote === note.id ? styles.clicked : ''}`}
            onClick={() => handleClick(note.id)}
        >
            <div className={styles.noteContent}>
                <div className={styles.dateBox}>
                    {new Date(note.date).toLocaleDateString()}
                </div>
                <Link
                 to={`/user-data/${note.id}`}
                  className={styles.noteLink}
                  state={{ date: note.date }}>
                    <img src={akp_icon} alt="Day Image" className={styles.noteImage} />
                </Link>
                <button
                    onClick={() => handleDelete(note.id)}
                    className={`${styles.button} ${styles.deleteButton}`}
                >
                    Delete
                </button>
            </div>
        </div>
    ))}
</div>
            </main>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Are you sure you want to delete?</h3>
                        <div className={styles.modalActions}>
                            <button onClick={confirmDelete} className={`${styles.button} ${styles.confirmButton}`}>Yes</button>
                            <button onClick={cancelDelete} className={`${styles.button} ${styles.cancelButton}`}>No</button>
                        </div>
                    </div>
                </div>
            )}
            {showNotifications && (
                <div className={styles.notificationsPanel}>
                    <h3>Notifications</h3>
                    {notifications.map((notification, index) => (
                        <div key={index} className={styles.notification}>
                            <p>{notification.message}</p>
                            <table className={styles.notificationTable}>
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Code</th>
                                        <th>Weight</th>
                                        <th>M3</th>
                                        <th>Color</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {JSON.parse(notification.entry_data).codes.map((code, idx) => (
                                        <tr key={idx} style={{ color: code.color || 'black' }}>
                                            <td>{idx + 1}</td>
                                            <td>{code.code}</td>
                                            <td>{code.weight}</td>
                                            <td>{code.m3}</td>
                                            <td>{code.color}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserHome;
