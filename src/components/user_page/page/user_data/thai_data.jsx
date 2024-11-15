import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate,Link,useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faEdit, faSave, faTimes, faPlus, faTrash,faArrowLeft, faSearch  } from '@fortawesome/free-solid-svg-icons';
import styles from '../../style/page/u_billdata.module.css';
import config from '../../../../config';

const UserThaiData = () => {
    const { id: dayId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        userName: '',
        phoneNumber: '',
        codes: [{ code: '', price: '' }],
        totalPrice: '',
        totalPriceThai: '',
    });
    const [entries, setEntries] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [editEntryId, setEditEntryId] = useState(null);
    const token = localStorage.getItem('token');
    const codeRefs = useRef([]);
    const editBoxRef = useRef(null);
    const location = useLocation();
    const selectedDate = location.state?.date
      ? new Date(location.state.date).toLocaleDateString()
      : "N/A";
      const [searchTerm, setSearchTerm] = useState("");
    
      const searchTimeout = useRef();
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
      const handleSearch = (e) => {
        const value = e.target.value.toLowerCase();
        setSearchTerm(value);
      
        // Use debounce to improve performance
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
          const filtered = entries.filter(
            (entry) =>
              entry.userName.toLowerCase().includes(value) ||
              entry.phoneNumber.toLowerCase().includes(value) ||
              entry.codes.some((code) => code.code.toLowerCase().includes(value))
          );
      
          setFilteredEntries(filtered);
        }, 300);
      };
      useEffect(() => {
        return () => {
          if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
          }
        };
      }, []);

    useEffect(() => {
        const totalThai = formData.codes.reduce((sum, { price }) => {
            return sum + (parseFloat(price) || 0);
        }, 0);
    
        setFormData(prevFormData => ({
            ...prevFormData,
            totalPriceThai: totalThai,
        }));
    }, [formData.codes]);
    const fetchEntries = useCallback(() => {
        axios.get(`${config.apiUrl}/user/getUserThaiEntries/${dayId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(response => {
                const reversedEntries = [...response.data].reverse();
                setEntries(reversedEntries);
                setFilteredEntries(reversedEntries);
            })
            .catch(error => {
                console.error('Error fetching user entries:', error);
                if (error.response?.status === 403) navigate('/');
            });
    }, [dayId, token, navigate]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCodeChange = (index, field, value) => {
        const newCodes = [...formData.codes];
        newCodes[index][field] = value;
        setFormData((prev) => ({ ...prev, codes: newCodes }));
    };

    const handleKeyNavigation = (event, index, field, value) => {
        if (event.key === 'ArrowDown' && index < formData.codes.length - 1) {
            event.preventDefault();
            codeRefs.current[index + 1]?.focus();
        } else if (event.key === 'ArrowUp' && index > 0) {
            event.preventDefault();
            codeRefs.current[index - 1]?.focus();
        }

        if (event.key === 'Enter' && field === 'code' && value !== '') {
            addNewColumn();
            setTimeout(() => codeRefs.current[index + 1]?.focus(), 0);
        }
    };

    const checkAllCodes = () => {
        const filteredCodes = formData.codes.filter(code => code.code !== '');
        const uniqueCodes = filteredCodes.filter((code, index, self) =>
            index === self.findIndex((c) => c.code === code.code)
        );

        const failedCodes = [];

        Promise.all(uniqueCodes.map(code =>
            axios.get(`${config.apiUrl}/user/getAdminThaiCode/${code.code}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).catch(error => {
                failedCodes.push(code.code);
                return null;
            })
        ))
            .then(responses => {
                const newCodes = uniqueCodes.map((code, index) => {
                    const response = responses[index]?.data;
                    return response ? { ...code, ...response } : code;
                });

                const newTotalPriceThai = newCodes.reduce((sum, code) => sum + (parseFloat(code.price) || 0), 0);

                setFormData(prev => ({
                    ...prev,
                    codes: newCodes,
                    totalPriceThai: newTotalPriceThai
                }));

                if (failedCodes.length > 0) {
                    alert(`Error fetching data for the following codes: ${failedCodes.join(', ')}. They may not exist or there was an issue fetching them.`);
                }
            })
            .catch(error => {
                console.error('Error fetching code data:', error);
                alert('An unexpected error occurred while fetching the codes.');
                if (error.response?.status === 403) navigate('/');
            });
    };

    const handleSubmit = () => {
        const filteredCodes = formData.codes.filter(code => code.code !== '');
        const uniqueCodes = filteredCodes.filter((code, index, self) =>
            index === self.findIndex((c) => c.code === code.code)
        );

        axios.post(`${config.apiUrl}/user/addUserThaiEntry`, {
            dayId,
            userName: formData.userName,
            phoneNumber: formData.phoneNumber,
            totalPrice: formData.totalPrice,
            totalPriceThai: formData.totalPriceThai
        }, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(response => {
                return axios.post(`${config.apiUrl}/user/addUserThaiCode`, {
                    entryId: response.data.entryId,
                    codes: uniqueCodes
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            })
            .then(() => {
                fetchEntries();
                alert('Data saved successfully!');
                resetForm();
            })
            .catch(error => {
                console.error('Error saving entry:', error);
                if (error.response?.status === 403) navigate('/');
                else alert('An error occurred. Please try again later.');
            });
    };

    const handlesaveEdit = () => {
        const filteredCodes = formData.codes.filter(code => code.code !== '');
        const uniqueCodes = filteredCodes.filter((code, index, self) =>
            index === self.findIndex((c) => c.code === code.code)
        );

        axios.put(`${config.apiUrl}/user/updateUserThaiEntry/${editEntryId}`, {
            ...formData,
            codes: uniqueCodes
        }, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(() => {
                fetchEntries();
                alert('Entry updated successfully!');
                resetForm();
            })
            .catch(error => {
                console.error('Error updating entry:', error);
                if (error.response?.status === 403) navigate('/');
            });
    };

    const resetForm = () => {
        setFormData({
            userName: '',
            phoneNumber: '',
            codes: [{ code: '', price: '' }],
            totalPrice: '',
            totalPriceThai: '',
        });
        setEditMode(false);
        setEditEntryId(null);
    };

    const handleEditClick = (entry) => {
        setEditMode(true);
        setEditEntryId(entry.id);
        setFormData({
            userName: entry.userName,
            phoneNumber: entry.phoneNumber,
            codes: entry.codes,
            totalPrice: entry.totalPrice,
            totalPriceThai: entry.totalPriceThai,
        });
        setTimeout(() => {
            if (editBoxRef.current) {
              editBoxRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 200);
    };

    const addNewColumn = () => {
        setFormData(prev => ({
            ...prev,
            codes: [...prev.codes, { code: '', price: '' }]
        }));
    };

    const deleteCode = (index) => {
        const codeToDelete = formData.codes[index];
        const updateCodes = (newCodes) => {
            setFormData(prev => ({
                ...prev,
                codes: newCodes,
                totalPriceThai: newCodes.reduce((sum, code) => sum + (parseFloat(code.price) || 0), 0)
            }));
        };

        const newCodes = formData.codes.filter((_, i) => i !== index);

        if (codeToDelete.id) {
            axios.delete(`${config.apiUrl}/user/deleteUserThaiCode/${editEntryId}/${codeToDelete.code}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(() => updateCodes(newCodes))
                .catch(error => {
                    console.error('Error deleting code:', error);
                    alert('Error deleting the code. Please try again.');
                    if (error.response?.status === 403) navigate('/');
                });
        } else {
            updateCodes(newCodes);
        }
    };

    const deleteEntry = (entryId) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            axios.delete(`${config.apiUrl}/user/deleteUserThaiEntry/${entryId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(() => {
                    fetchEntries();
                    alert('Entry deleted successfully!');
                })
                .catch(error => {
                    console.error('Error deleting the entry:', error);
                    if (error.response?.status === 403) navigate('/');
                    else alert('Failed to delete entry. Please try again.');
                });
        }
    };

    const formatPrice = (price) => {
        if (!price) return '0.00';
        const formattedPrice = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${formattedPrice} `;
    };

    const sendWhatsAppMessage = (entry) => {
        const sortedCodes = [...entry.codes].sort((a, b) => {
            if (a.price && !b.price) return -1;
            if (!a.price && b.price) return 1;
            return 0;
        });

        const currentDate = new Date().toLocaleDateString('en-GB');
        const formattedCodes = sortedCodes.map((code, idx) =>
            `${String(idx + 1).padStart(2)} ${code.code.padEnd(16, '\u00A0')}${code.price ? `${code.price} ฿` : ''}`
        ).join('\n');

        const totalPart = `Total: ${formatPrice(entry.totalPrice)} Kip${formatPrice(entry.totalPriceThai)} Baht`;

        const message = `\`\`\`
ມື້ນີ້ມີພັດສະດຸທ່ານເຂົ້າ ${sortedCodes.length} ລາຍການ
ສາມາດກວດສອບລະຫັດເເລະຄ່າຂົນສົ່ງຂອງວັນທີ
${currentDate} ໄດ້ດັ່ງຕໍ່ໄປນີ້:
ເຄື່ອງໄທ:
${formattedCodes}

${totalPart}
\`\`\``;

        window.open(`https://wa.me/+85620${entry.phoneNumber}?text=${encodeURIComponent(message)}`);
    };
    const renderNav = () => (
        <nav className={styles.navbar}>
          <Link to="/home-user" className={styles.backButton}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Homepage
          </Link>
          <div className={styles.dateDisplay}>Date: {selectedDate}</div>
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
      );
    const renderForm = () => (
        <div className={styles.addForm}  ref={editBoxRef}>
            <h3>{editMode ? 'Edit Thai Entry' : 'Add New Thai Entry'}</h3>
            <input
                type="text"
                value={formData.userName}
                placeholder="User Name"
                onChange={(e) => handleInputChange('userName', e.target.value)}
                className={styles.input}
            />
            <input
                type="text"
                value={formData.phoneNumber}
                placeholder="Phone Number"
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className={styles.input}
            />
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Code</th>
                        <th>Price</th>
                        <th>Delete</th>
                    </tr>
                </thead>
                <tbody>
                    {formData.codes.map((code, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                                <input
                                    ref={(el) => (codeRefs.current[index] = el)}
                                    type="text"
                                    value={code.code}
                                    onChange={(e) => handleCodeChange(index, 'code', e.target.value)}
                                    onKeyDown={(e) => handleKeyNavigation(e, index, 'code', e.target.value)}
                                    className={styles.tableInput}
                                />
                            </td>
                            <td>
                                <input
                                    type="number"
                                    value={code.price}
                                    onChange={(e) => handleCodeChange(index, 'price', parseFloat(e.target.value))}
                                    className={styles.tableInput}
                                />
                            </td>
                            <td>
                                <button onClick={() => deleteCode(index)} className={styles.deleteButton}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className={styles.buttonGroup}>
                {editMode && (
                    <button onClick={addNewColumn} className={styles.addButton}>
                        <FontAwesomeIcon icon={faPlus} /> Add New Column
                    </button>
                )}
                <button onClick={checkAllCodes} className={styles.checkButton}>Check All Codes</button>
            </div>
            <div className={styles.totals}>
                <div className={styles.totalItem}>
                <label>Total Price (Lao): </label>
                    <input
                        type="number"
                        value={formData.totalPrice}
                        onChange={(e) => handleInputChange('totalPrice', parseFloat(e.target.value))}
                        className={styles.totalPrice}
                    />
                    <h3>Kip</h3>
                </div>
                <div className={styles.totalItem}>
                <label>Total Price (Thai): </label>
                    <input
                        type="number"
                        value={formData.totalPriceThai}
                        onChange={(e) => handleInputChange('totalPriceThai', parseFloat(e.target.value))}
                        className={styles.totalPrice}
                        readOnly
                    />
                    <h3>Baht</h3>
                </div>
            </div>
            {editMode ? (
        <div className={styles.buttonGroup}>
            <button onClick={handlesaveEdit} className={styles.saveButton}>
                <FontAwesomeIcon icon={faSave} /> Save Edit
            </button>
            <button onClick={resetForm} className={styles.cancelButton}>
                <FontAwesomeIcon icon={faTimes} /> Cancel
            </button>
        </div>
    ) : (
        <button onClick={handleSubmit} className={styles.saveButton}>
            <FontAwesomeIcon icon={faSave} /> Save Data
        </button>
    )}
</div>
);

const renderEntries = () => (
    <div className={styles.entriesSection}>
        {filteredEntries.map(entry => (
            <div key={entry.id} className={styles.entryCard}>
                <h4 className={styles.entryHeader}>
                    Name: {highlightText(entry.userName, searchTerm)}
                    </h4>
                    <p>Phone: {highlightText(entry.phoneNumber, searchTerm)}</p>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Code</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entry.codes.sort((a, b) => {
                            if (a.price && !b.price) return -1;
                            if (!a.price && b.price) return 1;
                            return 0;
                        }).map((code, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td> {highlightText(code.code, searchTerm)}</td>
                                <td>
                                    {code.price ? `${code.price} ฿` : ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className={styles.entryTotals}>
                <p>
                   Total Price (Lao): {formatPrice(entry.totalPrice)} Kip | 
                   Total Price (Thai): {formatPrice(entry.totalPriceThai)} Baht
                  </p>
                </div>
                <div className={styles.actionbtn}>
                    <div className={styles.leftButtons}>
                        <button onClick={() => handleEditClick(entry)} className={styles.editButton}>
                            <FontAwesomeIcon icon={faEdit} /> Edit
                        </button>
                        <button onClick={() => sendWhatsAppMessage(entry)} className={styles.whatsappButton}>
                            <FontAwesomeIcon icon={faWhatsapp} /> Send WhatsApp
                        </button>
                    </div>
                    <div className={styles.rightButtons}>
                        <button onClick={() => deleteEntry(entry.id)} className={styles.deleteButton}>
                            <FontAwesomeIcon icon={faTrash} /> Delete
                        </button>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

return (
    <div className={styles.container}>
         {renderNav()}
        {renderForm()}
        {renderEntries()}
    </div>
);
};

export default UserThaiData;