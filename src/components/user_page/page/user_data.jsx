import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faArrowLeft, faSearch, faEdit, faSave, faTimes, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import styles from '../style/u_data.module.css';
import config from '../../../config';
const UserAddData = () => {
    const { id: dayId } = useParams();
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [codes, setCodes] = useState([{ code: '', weight: '', m3: '', color: '#000000' }]);
    const [totalPrice, setTotalPrice] = useState('');
    const [totalWeight, setTotalWeight] = useState('');
    const [totalM3, setTotalM3] = useState('');
    const [entries, setEntries] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editEntryId, setEditEntryId] = useState(null);
    const [editCodes, setEditCodes] = useState([]);
    const token = localStorage.getItem('token');
    const codeRefs = useRef([]);
    const editBoxRef = useRef(null);

    useEffect(() => {
        fetchEntries();
    }, [dayId]);

    useEffect(() => {
        setFilteredEntries(entries);
    }, [entries]);

    const fetchEntries = () => {
        axios.get(`${config.apiUrl}/user/getUserEntries/${dayId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(response => {
                setEntries(response.data);
            })
            .catch(error => {
                console.error('There was an error fetching user entries!', error);
                if (error.response && error.response.status === 403) {
                    navigate('/');
                }
            });
    };

    const addUserEntry = () => {
        const filteredCodes = codes.filter(code => code.code !== '');
        axios.post(`${config.apiUrl}/user/addUserEntry`, {
            dayId,
            userName,
            phoneNumber,
            totalPrice,
            totalWeight,
            totalM3
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then(response => {
            const entryId = response.data.entryId;
            return axios.post(`${config.apiUrl}/user/addUserCode`, {
                entryId,
                codes: filteredCodes
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        })
        .then(() => {
            fetchEntries();
            alert('Data saved successfully!');
            resetForm();
        })
        .catch(error => {
            console.error('There was an error saving the entry!', error);
            if (error.response && error.response.status === 403) {
                navigate('/');
            } else {
                alert('An error occurred. Please try again later.');
            }
        });
    };

    const resetForm = () => {
        setUserName('');
        setPhoneNumber('');
        setCodes([{ code: '', weight: '', m3: '', color: '#000000' }]);
        setTotalPrice('');
        setTotalWeight('');
        setTotalM3('');
        setEditMode(false);
        setEditEntryId(null);
        setEditCodes([]);
    };

    const handleCodeChange = (index, field, value) => {
        const newCodes = [...codes];
        newCodes[index][field] = value;
        setCodes(newCodes);
    
        if (field === 'code' && index === codes.length - 1 && value !== '') {
            setCodes([...newCodes, { code: '', weight: '', m3: '', color: '#000000' }]);
    
            setTimeout(() => {
                codeRefs.current[index + 1]?.focus();
            }, 0);
        }
    };

    const checkAllCodes = () => {
        const filteredCodes = codes.filter(code => code.code !== '');
        const promises = filteredCodes.map(code => 
            axios.get(`${config.apiUrl}/user/getAdminCode/${code.code}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
        );

        Promise.all(promises)
            .then(responses => {
                const newCodes = [...codes];
                let newTotalWeight = 0;
                let newTotalM3 = 0;

                responses.forEach((response, index) => {
                    const { weight, m3, color } = response.data;
                    newCodes[index].weight = weight;
                    newCodes[index].m3 = m3;
                    newCodes[index].color = color || '#000000';
                    newTotalWeight += parseFloat(weight) || 0;
                    newTotalM3 += parseFloat(m3) || 0;
                });

                setCodes(newCodes);
                setTotalWeight(newTotalWeight.toFixed(2));
                setTotalM3(newTotalM3.toFixed(4));
            })
            .catch(error => {
                console.error('Error fetching code data:', error);
                alert('There was an error fetching the data for one or more codes.');
                if (error.response && error.response.status === 403) {
                    navigate('/');
                }
            });
    };

    const sendWhatsAppMessage = (entry) => {
      let message = '';
      const sortedCodes = sortCodes(entry.codes);
      const totalItem = sortedCodes.length;
      const today = new Date();
      const currentDate = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`;
      const formattedCodes = sortedCodes.map((code, idx) => {
        const noPart = `${String(idx + 1).padStart(2)}`;
        const codePart = code.code.padEnd(16, '\u00A0');  // Use non-breaking space
        const weightPart = code.weight ? `${parseFloat(code.weight).toFixed(1).padStart(2)}kg` : '';
        const m3Part = code.m3 ? `${parseFloat(code.m3).toFixed(4).padStart(2)}m³` : '';
        
        return `${noPart} ${codePart}${weightPart}${m3Part}`;
      }).join('\n');
  
      const totalPart = `Total: ${entry.totalPrice.toLocaleString()}Kip  ${parseFloat(entry.totalWeight).toFixed(1)}kg ${parseFloat(entry.totalM3).toFixed(1)}m³`;
      
      message = 
  `\`\`\`
ມື້ນີ້ມີພັດສະດຸທ່ານເຂົ້າ ${totalItem} ລາຍການ
ສາມາດກວດສອບລະຫັດເເລະຄ່າຂົນສົ່ງຂອງວັນທີ
${currentDate} ໄດ້ດັ່ງຕໍ່ໄປນີ້:
ເຄື່ອງຈີນ:
${formattedCodes}

${totalPart}
  \`\`\``;

        const phoneNumber = `+85620${entry.phoneNumber}`;
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
    };

    const handleSearch = (e) => {
        const value = e.target.value.toLowerCase();
        setSearchTerm(value);

        const filtered = entries.filter(entry =>
            entry.userName.toLowerCase().includes(value) ||
            entry.phoneNumber.toLowerCase().includes(value) ||
            entry.codes.some(code => code.code.toLowerCase().includes(value))
        );

        setFilteredEntries(filtered);
    };

    const handleEditClick = (entry) => {
        setEditMode(true);
        setEditEntryId(entry.id);
        setUserName(entry.userName);
        setPhoneNumber(entry.phoneNumber);
        setTotalPrice(entry.totalPrice);
        setTotalWeight(entry.totalWeight);
        setTotalM3(entry.totalM3);
        setEditCodes(entry.codes);
        setTimeout(() => {
            if (editBoxRef.current) {
                editBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const addNewColumn = () => {
      const newEditCodes = [...editCodes, { code: '', weight: '', m3: '', color: '#000000' }];
      setEditCodes(newEditCodes);
      updateTotals(newEditCodes);
  };



    const updateTotals = (codes) => {
      const newTotalWeight = codes.reduce((sum, code) => sum + (parseFloat(code.weight) || 0), 0);
      const newTotalM3 = codes.reduce((sum, code) => sum + (parseFloat(code.m3) || 0), 0);
      setTotalWeight(newTotalWeight.toFixed(2));
      setTotalM3(newTotalM3.toFixed(2));
  };
  const handleEditCodeChange = (index, field, value) => {
    const newEditCodes = [...editCodes];
    newEditCodes[index][field] = value;
    setEditCodes(newEditCodes);
    updateTotals(newEditCodes);
};
    
  const deleteCode = (index) => {
    const codeToDelete = editCodes[index];
    if (codeToDelete.id) {
        axios.delete(`${config.apiUrl}/user/deleteUserCode/${editEntryId}/${codeToDelete.code}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then(() => {
            const newEditCodes = editCodes.filter((_, i) => i !== index);
            setEditCodes(newEditCodes);
            updateTotals(newEditCodes);
        })
        .catch(error => {
            console.error('Error deleting code:', error);
            alert('There was an error deleting the code. Please try again.');
            if (error.response && error.response.status === 403) {
                navigate('/');
            }
        });
    } else {
        const newEditCodes = editCodes.filter((_, i) => i !== index);
        setEditCodes(newEditCodes);
        updateTotals(newEditCodes);
    }
};

   

    const checkAllEditCodes = () => {
      const promises = editCodes.map(code => 
          axios.get(`${config.apiUrl}/user/getAdminCodeData/${code.code}`, {
              headers: {
                  Authorization: `Bearer ${token}`,
              },
          })
      );

      Promise.all(promises)
          .then(responses => {
              const newEditCodes = editCodes.map((code, index) => {
                  const { weight, m3, color } = responses[index].data;
                  return { ...code, weight, m3, color: color || '#000000' };
              });

              setEditCodes(newEditCodes);
              updateTotals(newEditCodes);
          })
          .catch(error => {
              console.error('Error fetching code data:', error);
              alert('There was an error fetching the data for one or more codes.');
              if (error.response && error.response.status === 403) {
                  navigate('/');
              }
          });
  };

  const saveEdit = () => {
    axios.put(`${config.apiUrl}/user/updateUserEntry/${editEntryId}`, {
        userName,
        phoneNumber,
        totalPrice,
        totalWeight,
        totalM3,
        codes: editCodes
    }, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    .then(() => {
        fetchEntries();
        alert('Entry updated successfully!');
        setEditMode(false);
        resetForm();
    })
    .catch(error => {
        console.error('There was an error updating the entry!', error);
        if (error.response && error.response.status === 403) {
            navigate('/');
        }
    });
};

    const cancelEdit = () => {
        setEditMode(false);
        resetForm();
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

    return (
        <div className={styles.container}>
      <nav className={styles.navbar}>
        <Link to="/home-user" className={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Homepage
        </Link>
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

      <div className={styles.content} ref={editBoxRef}>
        <div className={styles.editSection}>
          {editMode ? (
            <div className={styles.editForm}>
              <h3 className={styles.sectionTitle}>Edit Entry</h3>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="User Name"
                className={styles.input}
              />
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Phone Number"
                className={styles.input}
              />
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Code</th>
                    <th>Weight</th>
                    <th>M3</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {editCodes.map((code, index) => (
                    <tr key={index} style={{ color: code.color }}>
                      <td>{index + 1}</td>
                      <td>
                        <input
                          type="text"
                          value={code.code}
                          onChange={(e) => handleEditCodeChange(index, 'code', e.target.value)}
                          className={styles.tableInput}
                          style={{ color: code.color }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={code.weight}
                          onChange={(e) => handleEditCodeChange(index, 'weight', parseFloat(e.target.value))}
                          readOnly
                          className={styles.tableInput}
                          style={{ color: code.color }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={code.m3}
                          onChange={(e) => handleEditCodeChange(index, 'm3', parseFloat(e.target.value))}
                          readOnly
                          className={styles.tableInput}
                          style={{ color: code.color }}
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
                <button onClick={addNewColumn} className={styles.addButton}>
                  <FontAwesomeIcon icon={faPlus} /> Add New Column
                </button>
                <button onClick={checkAllEditCodes} className={styles.checkButton}>
                  Check All Codes
                </button>
              </div>
              <div className={styles.totalPrice}>
                <label>Total Price: </label>
                <input
                  type="number"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(parseFloat(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.buttonGroup}>
                <button onClick={saveEdit} className={styles.saveButton}>
                  <FontAwesomeIcon icon={faSave} /> Save Edit
                </button>
                <button onClick={cancelEdit} className={styles.cancelButton}>
                  <FontAwesomeIcon icon={faTimes} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.addForm}>
              <h3 className={styles.sectionTitle}>Add New Entry</h3>
              <input
                type="text"
                value={userName}
                placeholder="User Name"
                onChange={(e) => setUserName(e.target.value)}
                className={styles.input}
              />
              <input
                type="text"
                value={phoneNumber}
                placeholder="Phone Number"
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={styles.input}
              />
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
                  {codes.map((code, index) => (
                    <tr key={index} style={{ color: code.color }}>
                      <td>{index + 1}</td>
                      <td>
                        <input
                          ref={(el) => (codeRefs.current[index] = el)}
                          type="text"
                          value={code.code}
                          onChange={(e) => handleCodeChange(index, 'code', e.target.value)}
                          className={styles.tableInput}
                          style={{ color: code.color }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={code.weight}
                          onChange={(e) => handleCodeChange(index, 'weight', parseFloat(e.target.value))}
                          readOnly
                          className={styles.tableInput}
                          style={{ color: code.color }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={code.m3}
                          onChange={(e) => handleCodeChange(index, 'm3', parseFloat(e.target.value))}
                          readOnly
                          className={styles.tableInput}
                          style={{ color: code.color }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={checkAllCodes} className={styles.checkButton}>Check All Codes</button>
              <div className={styles.totals}>
                <div className={styles.totalItem}>
                  <label>Total Price: </label>
                  <input
                    type="number"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(parseFloat(e.target.value))}
                    className={styles.input}
                  />
                </div>
                <div className={styles.totalItem}>
                  <label>Total Weight: </label>
                  <span>{totalWeight}</span>
                </div>
                <div className={styles.totalItem}>
                  <label>Total M3: </label>
                  <span>{totalM3}</span>
                </div>
              </div>
              <button onClick={addUserEntry} className={styles.addButton}>
                <FontAwesomeIcon icon={faPlus} /> Add Data
              </button>
            </div>
          )}
        </div>

        <div className={styles.entriesSection}>
          <h3 className={styles.sectionTitle}>Entries</h3>
          {filteredEntries.map(entry => (
            <div key={entry.id} className={styles.entryCard}>
              <div className={styles.entryHeader}>
                <h4>{entry.userName}</h4>
                <p>{entry.phoneNumber}</p>
              </div>
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
                      <td style={{ color: code.color || 'black' }}>{index + 1}</td>
                      <td style={{ color: code.color || 'black' }}>{code.code}</td>
                      <td style={{ color: code.color || 'black' }}>
                        {code.weight ? `${code.weight} kg` : ''}
                      </td>
                      <td style={{ color: code.color || 'black' }}>
                        {code.m3 ? `${code.m3} m³` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.entryTotals}>
                <p>Total Price: {entry.totalPrice}</p>
                <p>Total Weight: {entry.totalWeight}</p>
                <p>Total M3: {entry.totalM3}</p>
              </div>
              <div className={styles.entryActions}>
              <button onClick={() => handleEditClick(entry)} className={styles.editButton}>
                  <FontAwesomeIcon icon={faEdit} /> Edit
                </button>
                <button onClick={() => sendWhatsAppMessage(entry)} className={styles.whatsappButton}>
                  <FontAwesomeIcon icon={faWhatsapp} /> Send WhatsApp 
                </button>
                
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
  
  export default UserAddData;