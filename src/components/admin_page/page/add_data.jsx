import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import styles from '../style/ad_data.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import config from '../../../config';
const AddData = () => {
    const { id: dayId } = useParams();
    const [formData, setFormData] = useState({
        userName: '',
        phoneNumber: '',
        codes: [{ code: '', weight: '', m3: '', color: '' }],
        totalPrice: '',
        totalWeight: '',
        totalM3: '',
    });
    const [entries, setEntries] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editEntryId, setEditEntryId] = useState(null);
    const codeRefs = useRef([]);
    const editBoxRef = useRef(null);
    const token = localStorage.getItem('token');

    const fetchEntries = useCallback(() => {
        axios.get(`${config.apiUrl}/admin/getAdminEntries/${dayId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(response => {
                setEntries(response.data);
                setFilteredEntries(response.data);
            })
            .catch(error => {
                console.error('Error fetching user entries:', error);
            });
    }, [dayId, token]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleCodeChange = (index, field, value) => {
        const newCodes = [...formData.codes];
        newCodes[index][field] = value;
        setFormData(prevState => ({ ...prevState, codes: newCodes }));

        if (!isEditing && field === 'code' && index === formData.codes.length - 1 && value !== '') {
            setFormData(prevState => ({
                ...prevState,
                codes: [...prevState.codes, { code: '', weight: '', m3: '', color: '' }]
            }));
            setTimeout(() => {
                if (codeRefs.current[index + 1]) {
                    codeRefs.current[index + 1].focus();
                }
            }, 0);
        }

        updateTotals(newCodes);
    };

    const updateTotals = (newCodes) => {
        const newTotalWeight = newCodes.reduce((sum, code) => sum + Number(code.weight || 0), 0);
        const newTotalM3 = newCodes.reduce((sum, code) => sum + Number(code.m3 || 0), 0);
        setFormData(prevState => ({
            ...prevState,
            totalWeight: newTotalWeight.toFixed(2),
            totalM3: newTotalM3.toFixed(4)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const url = isEditing 
            ? `${config.apiUrl}/admin/updateAdminEntry/${editEntryId}`
            : `${config.apiUrl}/admin/addAdminEntry`;
        const method = isEditing ? 'put' : 'post';

        axios[method](url, { ...formData, dayId }, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(() => {
            fetchEntries();
            resetForm();
            alert(isEditing ? 'Data updated successfully!' : 'Data saved successfully!');
        }).catch(error => {
            console.error('Error saving or updating the entry:', error);
        });
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

    const startEditing = (entry) => {
        setIsEditing(true);
        setEditEntryId(entry.id);
        setFormData({
            userName: entry.userName,
            phoneNumber: entry.phoneNumber,
            codes: entry.codes.length > 0 ? entry.codes : [{ code: '', weight: '', m3: '', color: '' }],
            totalPrice: entry.totalPrice,
            totalWeight: entry.totalWeight,
            totalM3: entry.totalM3,
        });
        setTimeout(() => {
            if (editBoxRef.current) {
                editBoxRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
            }
        }, 200);
    };

    const resetForm = () => {
        setFormData({
            userName: '',
            phoneNumber: '',
            codes: [{ code: '', weight: '', m3: '', color: '' }],
            totalPrice: '',
            totalWeight: '',
            totalM3: '',
        });
        setIsEditing(false);
        setEditEntryId(null);
    };

    const addNewRow = () => {
        if (isEditing) {
            setFormData(prevState => ({
                ...prevState,
                codes: [...prevState.codes, { code: '', weight: '', m3: '', color: '' }]
            }));
        }
    };

    const deleteRow = (index) => {
        if (isEditing && formData.codes.length > 1) {
            const newCodes = formData.codes.filter((_, i) => i !== index);
            setFormData(prevState => ({ ...prevState, codes: newCodes }));
            updateTotals(newCodes);
        }
    };

    const deleteCode = (codeId) => {
        if (isEditing) {
            axios.delete(`${config.apiUrl}/admin/deleteAdminCode/${codeId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(() => {
                    const newCodes = formData.codes.filter(code => code.id !== codeId);
                    setFormData(prevState => ({ ...prevState, codes: newCodes }));
                    updateTotals(newCodes);
                    alert('Code deleted successfully!');
                })
                .catch(error => {
                    console.error('Error deleting the code:', error);
                    alert('Failed to delete code. Please try again.');
                });
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

    const sendWhatsAppMessage = (entry) => {
        const popup = document.createElement('div');
        popup.className = styles.popup;
    
        popup.innerHTML = `
            <h3 class="${styles.popupTitle}">Select a Role</h3>
            <button class="${styles.roleButton}" data-role="user1">ສົ່ງໃຫ້ສາຂາ</button>
            <button class="${styles.roleButton}" data-role="user2">ສົ່ງໃຫ້ລູກຄ້າ</button>
            <button class="${styles.cancelButton}">Cancel</button>
        `;
    
        popup.onclick = (e) => {
            const role = e.target.getAttribute('data-role');
            if (role) {
                sendMessage(role);
                document.body.removeChild(popup);
            } else if (e.target.classList.contains(styles.cancelButton)) {
                document.body.removeChild(popup);
            }
        };
    
        document.body.appendChild(popup);
    
        const sendMessage = (role) => {
            let message = '';
            const today = new Date();
            const currentDate = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`;
            const sortedCodes = sortCodes(entry.codes);
            const totalItem = sortedCodes.length;
          
            if (role === 'user1') {
              message = `
ມື້ນີ້ມີພັດສະດຸຂອງສາຂາເຂົ້າຮອດສາງເເລ້ວ
ສາມາດກວດສອບລະຫັດ ເເລະ ຄ່າຂົນສົ່ງຂອງວັນທີ
${currentDate} ໄດ້ຜ່ານ:
https://akp-logistics.vercel.app/
              `;
            } else {
              const formattedCodes = sortedCodes.map((code, idx) => {
                const noPart = `${String(idx + 1).padStart(2)}`;
                const codePart = code.code.padEnd(16, '\u00A0');  // Use non-breaking space
                const weightPart = code.weight ? `${parseFloat(code.weight).toFixed(1).padStart(2)}kg` : '';
                const m3Part = code.m3 ? `${parseFloat(code.m3).toFixed(4).padStart(2)}m³` : '';
                
                return `${noPart} ${codePart}${weightPart}${m3Part}`;
              }).join('\n');
          
              const totalPart = `Total:${entry.totalPrice.toLocaleString()}Kip ${(entry.totalWeight)}kg ${(entry.totalM3)}m³`;
              
              message = 
               `\`\`\`
ມື້ນີ້ມີພັດສະດຸທ່ານເຂົ້າ ${totalItem} ລາຍການ
ສາມາດກວດສອບລະຫັດເເລະຄ່າຂົນສົ່ງຂອງວັນທີ
${currentDate} ໄດ້ດັ່ງຕໍ່ໄປນີ້:
ເຄື່ອງຈີນ:
${formattedCodes}

${totalPart}
            \`\`\``;
            }
          
            const phoneNumber = `+85620${entry.phoneNumber}`;
            window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
        };
    };

    return (
        <div className={styles.container}>
            <nav className={styles.nav}>
                <Link to="/home-admin" className={styles.backButton}>
                    Back to Homepage
                </Link>
                <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={handleSearch}
                    className={styles.searchInput}
                />
            </nav>

            <form onSubmit={handleSubmit} className={styles.formContainer} ref={editBoxRef}>
                <input
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleInputChange}
                    placeholder="User Name"
                    className={styles.input}
                />
                <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
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
                            <th>Color</th>
                            {isEditing && <th>Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {formData.codes.map((code, index) => (
                            <tr key={index}>
                                <td style={{ color: code.color || 'black' }}>{index + 1}</td>
                                <td>
                                    <input
                                        ref={(el) => codeRefs.current[index] = el}
                                        type="text"
                                        value={code.code}
                                        onChange={(e) => handleCodeChange(index, 'code', e.target.value)}
                                        style={{ color: code.color || 'black' }}
                                        className={styles.input}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={code.weight}
                                        onChange={(e) => handleCodeChange(index, 'weight', e.target.value)}
                                        style={{ color: code.color || 'black' }}
                                        className={styles.input}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={code.m3}
                                        onChange={(e) => handleCodeChange(index, 'm3', e.target.value)}
                                        style={{ color: code.color || 'black' }}
                                        className={styles.input}
                                    />
                                </td>
                                <td>
                                    <select
                                        value={code.color}
                                        onChange={(e) => handleCodeChange(index, 'color', e.target.value)}
                                        className={styles.input}
                                    >
                                        <option value="">Select Color</option>
                                        <option value="red">Red</option>
                                        <option value="blue">Blue</option>
                                    </select>
                                </td>
                                {isEditing && (
                                    <td>
                                        <button 
                                            onClick={() => code.id ? deleteCode(code.id) : deleteRow(index)}
                                            className={`${styles.actionButton} ${styles.deleteButton}`}
                                            disabled={formData.codes.length === 1}
                                            type="button"
                                        >
                                            <FontAwesomeIcon icon={faTrash} className={styles.icon} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {isEditing && (
                    <button 
                        onClick={addNewRow}
                        className={`${styles.actionButton} ${styles.addButton}`}
                        type="button"
                    >
                        <FontAwesomeIcon icon={faPlus} className={styles.icon} /> 
                    </button>
                )}

                <div>
                    <label>Total Price: </label>
                    <input
                        type="text"
                        name="totalPrice"
                        value={formData.totalPrice}
                        onChange={handleInputChange}
                        className={styles.input}
                    />
                   <label>Total Weight: {formData.totalWeight}</label>
                    <label>Total M3: {formData.totalM3}</label>
                </div>

                <button type="submit" className={styles.button}>
                    {isEditing ? 'Update' : 'Save'}
                </button>
                {isEditing && (
                    <button onClick={resetForm} className={`${styles.button} ${styles.cancelButton}`} type="button">
                        Cancel
                    </button>
                )}
            </form>

            {filteredEntries.map((entry, index) => (
                <div key={index} className={styles.entryContainer}>
                    <h4 className={styles.entryHeader}>User: {entry.userName}</h4>
                    <p>Phone: {entry.phoneNumber}</p>
                    <table className={styles.entryTable}>
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
                    <div className={styles.totalInfo}>
                        <p>Total Price: {entry.totalPrice} | Total Weight: {entry.totalWeight} | Total M3: {entry.totalM3}</p>
                    </div>
                    <button onClick={() => startEditing(entry)} className={`${styles.actionButton} ${styles.editButton}`}>
                        Edit
                    </button>
                    <button onClick={() => sendWhatsAppMessage(entry)} className={`${styles.actionButton} ${styles.whatsappButton}`}>
                        <FontAwesomeIcon icon={faWhatsapp} className={styles.icon} />
                        Send to WhatsApp
                    </button>
                </div>
            ))}
        </div>
    );
};

export default AddData;