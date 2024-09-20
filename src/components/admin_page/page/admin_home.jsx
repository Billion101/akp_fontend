import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../style/ad_home.module.css';
import config from '../../../config';
import akp_icon from '../../../assets/akp-box.png';
import logo from '../../../assets/akp-logo.png';

const HomeAdmin = () => {
    const navigate = useNavigate();
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedDayId, setSelectedDayId] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [clickedNote, setClickedNote] = useState(null);
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
        axios.get(`${config.apiUrl}/admin/getAdminDay`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            setNotes(response.data);
        })
        .catch(error => {
            console.error('There was an error fetching the days!', error);
        });
    }, []);

    const addDay = () => {
        if (!date) {
            alert('Please select a date.');
            return;
        }

        axios.post(`${config.apiUrl}/admin/addAdminDay`, { date }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
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
            axios.delete(`${config.apiUrl}/admin/deleteAdminDay/${selectedDayId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(() => {
                setNotes(notes.filter(note => note.id !== selectedDayId));
                setShowModal(false);  // Close the modal after deletion
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

    const handleManageUsersClick = (e) => {
        e.preventDefault();
        setShowPasswordModal(true);
    };

    const verifyAdminPassword = () => {
        axios.post(`${config.apiUrl}/admin/verifyAdminPassword`, { password: adminPassword }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            if (response.data.isValid) {
                setShowPasswordModal(false);
                setAdminPassword('');
                navigate('/manage-users');
            } else {
                alert('Incorrect password. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error verifying password:', error);
            alert('An error occurred. Please try again.');
        });
    };

    return (
        <div className={styles.container}>
            <nav className={styles.navbar}>
                <div className={styles.navContent}>
                <div className={styles.nameLogo}>
                <img src={logo} alt="AKP" className={styles.logo} />
                <h2 className={styles.title}>Admin Page</h2>
                </div>
                    <div>
                        <a href="/manage-users" onClick={handleManageUsersClick} className={styles.link}>Manage Users</a>
                        <button onClick={handleLogout} className={`${styles.button} ${styles.logoutButton}`}>Logout</button>
                    </div>
                </div>
            </nav>

            <main className={styles.main}>
                <div className={styles.addNoteSection}>
                    <h3 className={styles.addNoteTitle}>Add New Day</h3>
                    <div className={styles.addNoteForm}>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className={styles.dateInput}
                        />
                        <button onClick={addDay} className={`${styles.button} ${styles.addButton}`}>Add Day</button>
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
                 to={`/add-data/${note.id}`}
                  className={styles.noteLink}
                  state={{ date: note.date }}
                  >
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

            {/* Confirmation Modal for Delete */}
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

            {/* Password Verification Modal */}
            {showPasswordModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Admin Verification</h3>
                        <input
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className={styles.passwordInput}
                            placeholder="Enter admin password"
                        />
                        <div className={styles.modalActions}>
                            <button 
                                onClick={() => setShowPasswordModal(false)} 
                                className={`${styles.modalButton} ${styles.cancelButton}`}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={verifyAdminPassword} 
                                className={`${styles.modalButton} ${styles.confirmButton}`}
                            >
                                Verify
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeAdmin;