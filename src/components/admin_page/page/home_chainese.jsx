import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import styles from "../style/ad_home.module.css";
import config from "../../../config";
import akp_icon from "../../../assets/akp-box.png";

const HomeChainese = () => {
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [clickedNote, setClickedNote] = useState(null);
  const [totalPrice, setTotalPrice] = useState({});
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");

  const handleClick = (id) => {
    setClickedNote(id);
  };

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/admin/getAdminDay`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const sortedNotes = response.data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setNotes(sortedNotes);
        await Promise.all(sortedNotes.map((note) => fetchTotalPrice(note.id)));
      } catch (error) {
        console.error("There was an error fetching the days!", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const fetchTotalPrice = (dayId) => {
    axios
      .get(`${config.apiUrl}/admin/totalAdminPrice/${dayId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        setTotalPrice((prevState) => ({
          ...prevState,
          [dayId]: response.data.total_sum,
        }));
      })
      .catch((error) => {
        console.error(
          `There was an error fetching the total price for day ${dayId}!`,
          error
        );
      });
  };

  const formatPrice = (price) => {
    if (!price) return "0.00 ";
    const formattedPrice = price
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formattedPrice} `;
  };

  const addDay = async () => {
    if (!date) {
      alert("Please select a date.");
      return;
    }

    try {
      const response = await axios.post(
        `${config.apiUrl}/admin/addAdminDay`,
        { date, title },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setNotes([{ id: response.data.dayId, date, title }, ...notes]);
      setDate("");
      setTitle("");
    } catch (error) {
      console.error("There was an error adding the day!", error);
    }
  };

  const startEditing = (note) => {
    setSelectedDayId(note.id);
    setEditTitle(note.title || "");
    setEditDate(new Date(note.date).toISOString().split('T')[0]);
    setShowEditModal(true);
  };

  const cancelEditing = () => {
    setShowEditModal(false);
    setSelectedDayId(null);
    setEditTitle("");
    setEditDate("");
  };

  const saveTitle = async () => {
    try {
      await axios.put(
        `${config.apiUrl}/admin/editAdminDay/${selectedDayId}`,
        { 
          title: editTitle,
          date: editDate 
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setNotes(
        notes.map((note) =>
          note.id === selectedDayId 
            ? { ...note, title: editTitle, date: editDate } 
            : note
        )
      );

      setShowEditModal(false);
      setSelectedDayId(null);
      setEditTitle("");
      setEditDate("");
    } catch (error) {
      console.error("Error updating day:", error);
      alert("Failed to update day");
    }
  };

  const handleDelete = (dayId) => {
    setSelectedDayId(dayId);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (selectedDayId) {
      try {
        await axios.delete(
          `${config.apiUrl}/admin/deleteAdminDay/${selectedDayId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setNotes(notes.filter((note) => note.id !== selectedDayId));
        setShowModal(false);
      } catch (error) {
        console.error("There was an error deleting the day!", error);
      }
    }
  };

  const cancelDelete = () => {
    setSelectedDayId(null);
    setShowModal(false);
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); 
};

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.addNoteSection}>
          <h3 className={styles.addNoteTitle}>Add New Chainese Day</h3>
          <div className={styles.addNoteForm}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={styles.dateInput}
            />
            <input
              type="text"
              placeholder="Enter title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.titleInput}
            />
            <button
              onClick={addDay}
              className={`${styles.button} ${styles.addButton}`}
            >
              Add Day
            </button>
          </div>
        </div>

        <div className={styles.notesGrid}>
          {notes.map((note) => (
            <div
              key={note.id}
              className={`${styles.noteCard} ${
                clickedNote === note.id ? styles.clicked : ""
              }`}
              onClick={() => handleClick(note.id)}
            >
              <div className={styles.noteContent}>
                <div className={styles.dateBox}>
                 {formatDate(note.date)}
                </div>

                {note.title && (
                  <div className={styles.titleBox}>
                    <span className={styles.titlePrefix}>ລົດຄັນທີ: </span>
                    {note.title}
                  </div>
                )}

                <Link
                  to={`/add-chainesedata/${note.id}`}
                  className={styles.noteLink}
                  state={{ date: note.date }}
                >
                  <img
                    src={akp_icon}
                    alt="Day Image"
                    className={styles.noteImage}
                  />
                </Link>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(note);
                  }}
                  className={`${styles.button} ${styles.editButton}`}
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(note.id)}
                  className={`${styles.button} ${styles.deleteButton}`}
                >
                  Delete
                </button>

                <div className={styles.totalPrice}>
                  <p>
                    Total Price:{" "}
                    {loading
                      ? "Loading..."
                      : `${formatPrice(totalPrice[note.id])} kip`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Are you sure you want to delete?</h3>
            <div className={styles.modalActions}>
              <button
                onClick={confirmDelete}
                className={`${styles.button} ${styles.confirmButton}`}
              >
                Yes
              </button>
              <button
                onClick={cancelDelete}
                className={`${styles.button} ${styles.cancelButton}`}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Edit Day</h3>
            <div className={styles.editForm}>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className={styles.editDateInput}
              />
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter title"
                className={styles.editTitleInput}
              />
              <div className={styles.modalActions}>
                <button
                  onClick={saveTitle}
                  className={`${styles.button} ${styles.confirmButton}`}
                >
                  Save
                </button>
                <button
                  onClick={cancelEditing}
                  className={`${styles.button} ${styles.cancelButton}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeChainese;