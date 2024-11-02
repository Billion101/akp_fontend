import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../style/ad_home.module.css';
import config from '../../../config';
import akp_icon from '../../../assets/akp-box.png';


const HomeThai = () => {
    // const navigate = useNavigate();
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedDayId, setSelectedDayId] = useState(null);
    const [clickedNote, setClickedNote] = useState(null);
    const [totalPrice, setTotalPrice] = useState({});
    const [totalThaiPrice, setTotalThaiPrice] = useState({});
    const [loading, setLoading] = useState(true);  // Loading state

    const handleClick = (id) => {
        setClickedNote(id);
    };


    useEffect(() => {
        // Fetch existing notes when the component mounts
        const fetchNotes = async () => {
            try {
                const response = await axios.get(`${config.apiUrl}/admin/getAdminThaiDay`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                // Sort the notes by date in descending order
                const sortedNotes = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
                setNotes(sortedNotes);
                // Fetch total prices for each note
                await Promise.all(sortedNotes.map(note => fetchTotalPrice(note.id)));
                await Promise.all(sortedNotes.map(note => fetchTotalThaiPrice(note.id)));
            } catch (error) {
                console.error('There was an error fetching the days!', error);
            } finally {
                setLoading(false);  // Set loading to false after fetching
            }
        };

        fetchNotes();
    }, []);

    const fetchTotalPrice = (dayId) => {
        axios.get(`${config.apiUrl}/admin/totalAdminLaoPrice/${dayId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            setTotalPrice(prevState => ({
                ...prevState,
                [dayId]: response.data.total_sum  // Store the total sum for this day
            }));
        })
        .catch(error => {
            console.error(`There was an error fetching the total price for day ${dayId}!`, error);
        });
    };
    const fetchTotalThaiPrice = (dayId) => {
        axios.get(`${config.apiUrl}/admin/totalAdminThaiPrice/${dayId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            setTotalThaiPrice(prevState => ({
                ...prevState,
                [dayId]: response.data.total_sum  // Store the total sum for this day
            }));
        })
        .catch(error => {
            console.error(`There was an error fetching the total price for day ${dayId}!`, error);
        });
    };

    const formatPrice = (price) => {
        if (!price) return '0.00 '; // Return '0.00 Kip' if no price is available
        const formattedPrice = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${formattedPrice} `; // Append ' Kip' to the formatted price
    };

    const addDay = async () => {
        if (!date) {
            alert('Please select a date.');
            return;
        }

        try {
            const response = await axios.post(`${config.apiUrl}/admin/addAdminThaiDay`, { date }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            // Add the new day to the beginning of the array
            setNotes([{ id: response.data.dayId, date }, ...notes]);
            setDate(''); // Clear the input
        } catch (error) {
            console.error('There was an error adding the day!', error);
        }
    };

    const handleDelete = (dayId) => {
        setSelectedDayId(dayId);
        setShowModal(true);  // Show confirmation modal
    };

    const confirmDelete = async () => {
        if (selectedDayId) {
            try {
                await axios.delete(`${config.apiUrl}/admin/deleteAdminThaiDay/${selectedDayId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setNotes(notes.filter(note => note.id !== selectedDayId));
                setShowModal(false);  // Close the modal after deletion
            } catch (error) {
                console.error('There was an error deleting the day!', error);
            }
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
                    <h3 className={styles.addNoteTitle}>Add New Thai Day</h3>
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
                                    to={`/add-thaidata/${note.id}`}
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
                                <div className={styles.totalPrice}>
                                <p> Total Price: {loading ? 'Loading...' : `${formatPrice(totalPrice[note.id])}kip`}</p>
                                   <p> Total Price: {loading ? 'Loading...' : `${formatPrice(totalThaiPrice[note.id])}Bath`}</p>
                                </div>
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
        </div>
    );
};

export default HomeThai;
