import React, { useState, useEffect} from 'react';
import axios from 'axios';
import {Link } from 'react-router-dom';
import styles from '../style/u_home.module.css';
import config from '../../../config';
import akp_icon from '../../../assets/akp-box.png';

const UserHomeChainese = () => {
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState([]);
    const token = localStorage.getItem('token');
    const [showModal, setShowModal] = useState(false);
    const [selectedDayId, setSelectedDayId] = useState(null); 
    const [clickedNote, setClickedNote] = useState(null);
    const [totalPrice, setTotalPrice] = useState({});
    const [loading, setLoading] = useState(true);

    const handleClick = (id) => {
        setClickedNote(id);
    };

    useEffect(() => {
        setLoading(true);
        // Fetch existing notes when the component mounts
        axios.get(`${config.apiUrl}/user/getUserDay`, {
            headers: {
                Authorization: `Bearer ${token}`, // Use the correct token from localStorage
            },
        })
            .then(response => {
                // Sort the notes by date in descending order
                const sortedNotes = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
                setNotes(sortedNotes);
                sortedNotes.forEach(note => {
                    fetchTotalPrice(note.id);
                    // fetchTotalThaiPrice(note.id); 
                });
            })
            .catch(error => {
                console.error('There was an error fetching the days!', error);
                
            })
            .finally(() => {
                setLoading(false); // Set loading to false when fetching is done
            });
    }, [token]);

    const fetchTotalPrice = (dayId) => {
        axios.get(`${config.apiUrl}/user/totalUserPrice/${dayId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            setTotalPrice(prevState => ({
                ...prevState,
                [dayId]: response.data.total_sum
            }));
        })
        .catch(error => {
            console.error(`There was an error fetching total price for day ${dayId}!`, error);
        });
    };

    const formatPrice = (price) => {
        if (!price) return '0.00 ';
        const formattedPrice = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${formattedPrice} `;
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
                // Prepend the new day to the beginning of the notes array
                setNotes([{ id: response.data.dayId, date }, ...notes]);
                // Fetch the total price for the newly added day
                fetchTotalPrice(response.data.dayId);
                // fetchTotalThaiPrice(response.data.dayId);
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
                                 to={`/user-chainesedata/${note.id}`}
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
                                <div className={styles.totalPrice}>
                                   <p> Total Price: {loading ? 'Loading...' : `${formatPrice(totalPrice[note.id])}Kip`}</p>
                                </div>
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
        </div>
    );
};

export default UserHomeChainese;
