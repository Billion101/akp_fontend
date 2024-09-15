import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    const [formData, setFormData] = useState({
        userName: '',
        phoneNumber: '',
        codes: [{ code: '', weight: '', m3: '', color: '#000000' }],
        totalPrice: '',
        totalWeight: '',
        totalM3: '',
    });
    const [entries, setEntries] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editEntryId, setEditEntryId] = useState(null);
    const token = localStorage.getItem('token');
    const codeRefs = useRef([]);
    const editBoxRef = useRef(null);

    const fetchEntries = useCallback(() => {
        axios.get(`${config.apiUrl}/user/getUserEntries/${dayId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then(response => {
            setEntries(response.data);
            setFilteredEntries(response.data);
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
      setFormData(prev => ({ ...prev, codes: newCodes }));

      // Only auto-create new column when not in edit mode
      if (!editMode && field === 'code' && index === formData.codes.length - 1 && value !== '') {
          setFormData(prev => ({
              ...prev,
              codes: [...newCodes, { code: '', weight: '', m3: '', color: '#000000' }]
          }));
          setTimeout(() => codeRefs.current[index + 1]?.focus(), 0);
      }
  };

    const checkAllCodes = () => {
        const filteredCodes = formData.codes.filter(code => code.code !== '');
        Promise.all(filteredCodes.map(code => 
            axios.get(`${config.apiUrl}/user/getAdminCode/${code.code}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
        ))
        .then(responses => {
            const newCodes = formData.codes.map((code, index) => {
                const response = responses[index]?.data;
                return response ? { ...code, ...response, color: response.color || '#000000' } : code;
            });
            const newTotalWeight = newCodes.reduce((sum, code) => sum + (parseFloat(code.weight) || 0), 0);
            const newTotalM3 = newCodes.reduce((sum, code) => sum + (parseFloat(code.m3) || 0), 0);
            setFormData(prev => ({
                ...prev,
                codes: newCodes,
                totalWeight: newTotalWeight.toFixed(2),
                totalM3: newTotalM3.toFixed(4)
            }));
        })
        .catch(error => {
            console.error('Error fetching code data:', error);
            alert('Error fetching data for one or more codes.');
            if (error.response?.status === 403) navigate('/');
        });
    };

    const addUserEntry = () => {
        const filteredCodes = formData.codes.filter(code => code.code !== '');
        axios.post(`${config.apiUrl}/user/addUserEntry`, {
            dayId,
            userName: formData.userName,
            phoneNumber: formData.phoneNumber,
            totalPrice: formData.totalPrice,
            totalWeight: formData.totalWeight,
            totalM3: formData.totalM3
        }, {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then(response => {
            return axios.post(`${config.apiUrl}/user/addUserCode`, {
                entryId: response.data.entryId,
                codes: filteredCodes
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

    const resetForm = () => {
        setFormData({
            userName: '',
            phoneNumber: '',
            codes: [{ code: '', weight: '', m3: '', color: '#000000' }],
            totalPrice: '',
            totalWeight: '',
            totalM3: '',
        });
        setEditMode(false);
        setEditEntryId(null);
    };

    const handleSearch = (e) => {
        const value = e.target.value.toLowerCase();
        setSearchTerm(value);
        setFilteredEntries(entries.filter(entry =>
            entry.userName.toLowerCase().includes(value) ||
            entry.phoneNumber.toLowerCase().includes(value) ||
            entry.codes.some(code => code.code.toLowerCase().includes(value))
        ));
    };

    const handleEditClick = (entry) => {
        setEditMode(true);
        setEditEntryId(entry.id);
        setFormData({
            userName: entry.userName,
            phoneNumber: entry.phoneNumber,
            codes: entry.codes,
            totalPrice: entry.totalPrice,
            totalWeight: entry.totalWeight,
            totalM3: entry.totalM3,
        });
        setTimeout(() => editBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    const addNewColumn = () => {
      setFormData(prev => ({
          ...prev,
          codes: [...prev.codes, { code: '', weight: '', m3: '', color: '#000000' }]
      }));
      // Focus on the new input after a short delay to ensure the DOM has updated
      setTimeout(() => {
          const newIndex = formData.codes.length;
          codeRefs.current[newIndex]?.focus();
      }, 0);
  };

    const deleteCode = (index) => {
        const codeToDelete = formData.codes[index];
        if (codeToDelete.id) {
            axios.delete(`${config.apiUrl}/user/deleteUserCode/${editEntryId}/${codeToDelete.code}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then(() => {
                const newCodes = formData.codes.filter((_, i) => i !== index);
                setFormData(prev => ({
                    ...prev,
                    codes: newCodes,
                    totalWeight: newCodes.reduce((sum, code) => sum + (parseFloat(code.weight) || 0), 0).toFixed(2),
                    totalM3: newCodes.reduce((sum, code) => sum + (parseFloat(code.m3) || 0), 0).toFixed(2)
                }));
            })
            .catch(error => {
                console.error('Error deleting code:', error);
                alert('Error deleting the code. Please try again.');
                if (error.response?.status === 403) navigate('/');
            });
        } else {
            const newCodes = formData.codes.filter((_, i) => i !== index);
            setFormData(prev => ({
                ...prev,
                codes: newCodes,
                totalWeight: newCodes.reduce((sum, code) => sum + (parseFloat(code.weight) || 0), 0).toFixed(2),
                totalM3: newCodes.reduce((sum, code) => sum + (parseFloat(code.m3) || 0), 0).toFixed(2)
            }));
        }
    };

    const saveEdit = () => {
        axios.put(`${config.apiUrl}/user/updateUserEntry/${editEntryId}`, {
            ...formData
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

    const sendWhatsAppMessage = (entry) => {
        const sortedCodes = [...entry.codes].sort((a, b) => {
            if (a.weight && !b.weight) return -1;
            if (!a.weight && b.weight) return 1;
            if (a.m3 && !b.m3) return 1;
            if (!a.m3 && b.m3) return -1;
            return 0;
        });
        
        const currentDate = new Date().toLocaleDateString('en-GB');
        const formattedCodes = sortedCodes.map((code, idx) => 
            `${String(idx + 1).padStart(2)} ${code.code.padEnd(16, '\u00A0')}${code.weight ? `${parseFloat(code.weight).toFixed(1).padStart(2)}kg` : ''}${code.m3 ? `${parseFloat(code.m3).toFixed(4).padStart(2)}m³` : ''}`
        ).join('\n');

        const totalPart = `Total: ${entry.totalPrice.toLocaleString()}Kip  ${parseFloat(entry.totalWeight).toFixed(1)}kg ${parseFloat(entry.totalM3).toFixed(1)}m³`;
        
        const message = `\`\`\`
ມື້ນີ້ມີພັດສະດຸທ່ານເຂົ້າ ${sortedCodes.length} ລາຍການ
ສາມາດກວດສອບລະຫັດເເລະຄ່າຂົນສົ່ງຂອງວັນທີ
${currentDate} ໄດ້ດັ່ງຕໍ່ໄປນີ້:
ເຄື່ອງຈີນ:
${formattedCodes}

${totalPart}
\`\`\``;

        window.open(`https://wa.me/+85620${entry.phoneNumber}?text=${encodeURIComponent(message)}`);
    };

    // Render functions
    const renderForm = () => (
      <div className={styles.addForm}>
          <h3 >{editMode ? 'Edit Entry' : 'Add New Entry'}</h3>
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
                      <th>Weight</th>
                      <th>M3</th>
                      {editMode && <th>Actions</th>}
                  </tr>
              </thead>
              <tbody>
                  {formData.codes.map((code, index) => (
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
                          {editMode && (
                              <td>
                                  <button onClick={() => deleteCode(index)} className={styles.deleteButton}>
                                      <FontAwesomeIcon icon={faTrash} />
                                  </button>
                              </td>
                          )}
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
                  <label>Total Price: </label>
                  <input
                      type="number"
                      value={formData.totalPrice}
                      onChange={(e) => handleInputChange('totalPrice', parseFloat(e.target.value))}
                      className={styles.input}
                  />
              </div>
              <div className={styles.totalItem}>
                  <label>Total Weight: </label>
                  <span>{formData.totalWeight}</span>
              </div>
              <div className={styles.totalItem}>
                  <label>Total M3: </label>
                  <span>{formData.totalM3}</span>
              </div>
          </div>
          {editMode ? (
              <div className={styles.buttonGroup}>
                  <button onClick={saveEdit} className={styles.saveButton}>
                      <FontAwesomeIcon icon={faSave} /> Save Edit
                  </button>
                  <button onClick={resetForm} className={styles.cancelButton}>
                      <FontAwesomeIcon icon={faTimes} /> Cancel
                  </button>
              </div>
          ) : (
              <button onClick={addUserEntry} className={styles.saveButton}>
                  <FontAwesomeIcon icon={faSave} /> Save Data
              </button>
          )}
      </div>
  );

  const renderEntries = () => (
      <div className={styles.entriesSection}>
          {filteredEntries.map(entry => (
              <div key={entry.id} className={styles.entryCard}>
                  <h4 className={styles.entryHeader}>User: {entry.userName}</h4>
                  <p>Phone: {entry.phoneNumber}</p>
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
                          {entry.codes.sort((a, b) => {
                              if (a.weight && !b.weight) return -1;
                              if (!a.weight && b.weight) return 1;
                              if (a.m3 && !b.m3) return 1;
                              if (!a.m3 && b.m3) return -1;
                              return 0;
                          }).map((code, index) => (
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
                  <p>Total Price: {entry.totalPrice} | Total Weight: {entry.totalWeight} | Total M3: {entry.totalM3}</p>
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
  );

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
              {renderForm()}
              {renderEntries()}
          </div>
      </div>
  );
};

export default UserAddData;