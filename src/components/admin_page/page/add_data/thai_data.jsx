import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useParams ,Link, useLocation} from "react-router-dom";
import styles from "../../style/page/ad_billdata.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import {
  faSearch,
  faArrowLeft,
  faPlus,
  faTrash,
  faSave,
  faTimes,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import config from "../../../../config";

const AddThaiData = () => {
  const { id: dayId } = useParams();
  const [formData, setFormData] = useState({
    userName: "",
    phoneNumber: "",
    codes: [{ code: "", price: "" }],
    totalPrice: "",
    totalPrices: "",
    userId: "",
  });
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editEntryId, setEditEntryId] = useState(null);
  const codeRefs = useRef([]);
  const editBoxRef = useRef(null);
  const token = localStorage.getItem("token");
  const [editingCell] = useState(null);
  const inputRefs = useRef([]);
  const location = useLocation();
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // "DD/MM/YYYY" format
};

const selectedDate = location.state?.date
    ? formatDate(location.state.date)
    : "N/A";
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedRole, setSelectedRole] = useState("client");
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
      fetchUsers();
    }, []);
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/admin/getUserlist`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    const handleRoleChange = (e) => {
      setSelectedRole(e.target.value);
      if (e.target.value === "client") {
        setFormData((prevState) => ({ ...prevState, userId: "", userName: "" }));
      } else {
        setFormData((prevState) => ({ ...prevState, userName: "" }));
      }
    };
    const handleUserSelect = (e) => {
      const userId = e.target.value;
      const selectedUser = users.find(user => user.id.toString() === userId);
      setFormData((prevState) => ({ 
        ...prevState, 
        userId: userId,
        userName: selectedUser ? selectedUser.username : ""
      }));
    };

  const handleKeyDown = (e, index, field) => {
    if (editingCell) return;

    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "code") {
        handleCodeKeyPress(e, index);
        setTimeout(() => {
          inputRefs.current[index + 1]?.code?.focus();
        }, 0);
      }
    } else if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
    ) {
      e.preventDefault();
      navigateCell(e.key, index, field);
    }
  };

  const navigateCell = (direction, currentIndex, currentField) => {
    const fields = ["code", "price"];
    let newIndex = currentIndex;
    let newField = currentField;

    switch (direction) {
      case "ArrowUp":
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case "ArrowDown":
        newIndex = Math.min(formData.codes.length - 1, currentIndex + 1);
        break;
      case "ArrowLeft":
        newField = fields[Math.max(0, fields.indexOf(currentField) - 1)];
        break;
      case "ArrowRight":
        newField = fields[Math.min(fields.length - 1, fields.indexOf(currentField) + 1)];
        break;
      default:
        break;
    }

    inputRefs.current[newIndex]?.[newField]?.focus();
  };

  const fetchEntries = useCallback(() => {
    axios
      .get(`${config.apiUrl}/admin/getAdminThaiEntries/${dayId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const reversedEntries = [...response.data].reverse();
        setEntries(reversedEntries);
        setFilteredEntries(reversedEntries);
      })
      .catch((error) => {
        console.error("Error fetching user entries:", error);
      });
  }, [dayId, token]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

 

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleCodeKeyPress = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (formData.codes[index].code.trim() !== "") {
        setFormData((prevState) => ({
          ...prevState,
          codes: [...prevState.codes, { code: "", price: "" }],
        }));
        setTimeout(() => {
          if (codeRefs.current[index + 1]) {
            codeRefs.current[index + 1].focus();
          }
        }, 0);
      }
    }
  };

  const handleCodeChange = (index, field, value) => {
    const newCodes = [...formData.codes];
    newCodes[index][field] = value;
    setFormData((prevState) => ({ ...prevState, codes: newCodes }));
    updateTotals(newCodes);
  };

  const updateTotals = (newCodes) => {
    const uniqueCodes = newCodes.filter(
      (code, index, self) =>
        index === self.findIndex((c) => c.code === code.code)
    );

    const newTotalPrices = uniqueCodes.reduce(
      (sum, code) => sum + Number(code.price || 0),
      0
    );

    setFormData((prevState) => ({
      ...prevState,
      totalPrices: newTotalPrices,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const uniqueCodes = formData.codes.reduce((acc, currentCode) => {
      const isDuplicate = acc.find((code) => code.code === currentCode.code);
      return isDuplicate ? acc : [...acc, currentCode];
    }, []);

    const submissionData = {
      ...formData,
      codes: uniqueCodes,
      dayId,
      // Include both userId and userName in the submission
      userId: selectedRole === "user" ? formData.userId : null,
      userName: selectedRole === "user" ? 
        users.find(u => u.id.toString() === formData.userId)?.username : 
        formData.userName
    };

    const url = isEditing
      ? `${config.apiUrl}/admin/updateAdminThaiEntry/${editEntryId}`
      : `${config.apiUrl}/admin/addAdminThaiEntry`;
    const method = isEditing ? "put" : "post";

    axios[method](
      url,
      submissionData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then(() => {
        fetchEntries();
        resetForm();
        alert(isEditing ? "Data updated successfully!" : "Data saved successfully!");
      })
      .catch((error) => {
        console.error("Error saving or updating the entry:", error);
      });
  };

  const startEditing = (entry) => {
    setIsEditing(true);
    setEditEntryId(entry.id);
    
    // Find if the userName matches any user in the users list
    const matchingUser = users.find(user => user.username === entry.userName);
    
    if (matchingUser) {
      // If we found a matching user, this is a user entry
      setSelectedRole("user");
      setFormData({
        userName: entry.userName,
        phoneNumber: entry.phoneNumber,
        codes: entry.codes.length > 0 ? entry.codes : [{ code: "", price: "" }],
        totalPrice: entry.totalPrice,
        totalPrices: entry.totalPrices,
        userId: matchingUser.id.toString()
      });
    } else {
      // If no matching user found, this is a client entry
      setSelectedRole("client");
      setFormData({
        userName: entry.userName,
        phoneNumber: entry.phoneNumber,
        codes: entry.codes.length > 0 ? entry.codes : [{ code: "", price: "" }],
        totalPrice: entry.totalPrice,
        totalPrices: entry.totalPrices,
        userId: ""
      });
    }

    setTimeout(() => {
      if (editBoxRef.current) {
        editBoxRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 200);
  };

  const resetForm = () => {
    setFormData({
      userName: "",
      phoneNumber: "",
      codes: [{ code: "", price: "" }],
      totalPrice: "",
      totalPrices: "",
      userId: "",
    });
    setIsEditing(false);
    setEditEntryId(null);
  };

  const addNewRow = () => {
    if (isEditing) {
      setFormData((prevState) => ({
        ...prevState,
        codes: [...prevState.codes, { code: "", price: "" }],
      }));
    }
  };

  const deleteRow = (index) => {
    const newCodes = formData.codes.filter((_, i) => i !== index);
    setFormData((prevState) => ({ ...prevState, codes: newCodes }));
    updateTotals(newCodes);
    if (isEditing && formData.codes[index].id) {
      deleteCode(formData.codes[index].id);
    }
  };

  const deleteCode = (codeId) => {
    if (isEditing) {
      axios
        .delete(`${config.apiUrl}/admin/deleteAdminThaiCode/${codeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          const newCodes = formData.codes.filter((code) => code.id !== codeId);
          setFormData((prevState) => ({ ...prevState, codes: newCodes }));
          updateTotals(newCodes);
          alert("Code deleted successfully!");
        })
        .catch((error) => {
          console.error("Error deleting the code:", error);
          alert("Failed to delete code. Please try again.");
        });
    }
  };

  const deleteEntry = (entryId) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      axios
        .delete(`${config.apiUrl}/admin/deleteAdminThaiEntry/${entryId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          fetchEntries();
          alert("Entry deleted successfully!");
        })
        .catch((error) => {
          console.error("Error deleting the entry:", error);
          alert("Failed to delete entry. Please try again.");
        });
    }
  };

  const formatPrice = (price) => {
    if (!price) return "0.00";
    const formattedPrice = price
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formattedPrice} `;
  };

  const sendWhatsAppMessage = (entry) => {
    const popup = document.createElement("div");
    popup.className = styles.popup;

    popup.innerHTML = `
      <h3 class="${styles.popupTitle}">ເລືອກຈະສົ່ງໄປຫາ:</h3>
      <button class="${styles.roleButton}" data-role="user1">ສົ່ງໃຫ້ສາຂາ</button>
      <button class="${styles.roleButton}" data-role="user2">ສົ່ງໃຫ້ລູກຄ້າ</button>
      <button class="${styles.cancelsButton}">ຍົກເລີກ</button>
    `;

    popup.onclick = (e) => {
      const role = e.target.getAttribute("data-role");
      if (role) {
        sendMessage(role);
        document.body.removeChild(popup);
      } else if (e.target.classList.contains(styles.cancelsButton)) {
        document.body.removeChild(popup);
      }
    };

    document.body.appendChild(popup);

    const sendMessage = (role) => {
      let message = "";
      const today = new Date();
      const currentDate = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`;
      const totalItems = entry.codes.length;

      if (role === "user1") {
        message = `
ມື້ນີ້ມີພັດສະດຸຂອງສາຂາເຂົ້າຮອດສາງເເລ້ວ
ສາມາດກວດສອບລະຫັດ ເເລະ ຄ່າຂົນສົ່ງຂອງວັນທີ
${currentDate} ໄດ້ຜ່ານ:
https://www.akplogistics.com
        `;
      } else {
        const formattedCodes = entry.codes
          .map((code, idx) => {
            const noPart = `${String(idx + 1).padStart(2)}`;
            const codePart = code.code.padEnd(16, "\u00A0");
            const pricePart = code.price ? `${code.price} ฿` : "";
            return `${noPart} ${codePart}${pricePart}`;
          })
          .join("\n");

        message = `\`\`\`
ມື້ນີ້ມີພັດສະດຸທ່ານເຂົ້າ ${totalItems} ລາຍການ
ສາມາດກວດສອບລະຫັດເເລະຄ່າຂົນສົ່ງຂອງວັນທີ
${currentDate} ໄດ້ດັ່ງຕໍ່ໄປນີ້:
ເຄື່ອງໄທ:
${formattedCodes}

Total Price (Lao): ${formatPrice(entry.totalPrice)} Kip
Total Price (Thai): ${formatPrice(entry.totalPrices)} Baht
        \`\`\``;
      }

      const phoneNumber = `+85620${entry.phoneNumber}`;
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
    };
  };
  const renderNav = () => (
    <nav className={styles.navbar}>
      <Link to="/home-admin" className={styles.backButton}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Back to Homepage
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
    <form onSubmit={handleSubmit} className={styles.formContainer} ref={editBoxRef}>
      <h3>{isEditing ? "Edit Thai Entry" : "Add New Thai Entry"}</h3>
      <select
        value={selectedRole}
        onChange={handleRoleChange}
        className={styles.selectRole}
      >
        <option value="client">Client</option>
        <option value="user">User</option>
      </select>
      {selectedRole === "client" ? (
        <input
          type="text"
          name="userName"
          value={formData.userName}
          onChange={handleInputChange}
          placeholder="User Name"
          className={styles.inputUP}
        />
      ) : (
        <select
          name="userId"
          value={formData.userId}
          onChange={handleUserSelect}
          className={styles.inputUP}
        >
          <option value="">Select User</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>
      )}
      <input
        type="text"
        name="phoneNumber"
        value={formData.phoneNumber}
        onChange={handleInputChange}
        placeholder="Phone Number"
        className={styles.inputUP}
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
                  ref={(el) => {
                    inputRefs.current[index] = inputRefs.current[index] || {};
                    inputRefs.current[index].code = el;
                  }}
                  type="text"
                  value={code.code}
                  onChange={(e) => handleCodeChange(index, "code", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index, "code")}
                  className={styles.input}
                />
              </td>
              <td>
                <input
                  ref={(el) => {
                    inputRefs.current[index] = inputRefs.current[index] || {};
                    inputRefs.current[index].price = el;
                  }}
                  type="text"
                  value={code.price}
                  onChange={(e) => handleCodeChange(index, "price", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index, "price")}
                  className={styles.input}
                />
              </td>
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
            </tr>
          ))}
        </tbody>
      </table>

      {isEditing && (
        <button onClick={addNewRow} className={styles.addButton} type="button">
          <FontAwesomeIcon icon={faPlus} className={styles.icon} /> Add New Row
        </button>
      )}

      <div className={styles.totals}>
        <div className={styles.totalItem}>
          <label>Total Price (Lao): </label>
          <input
            type="number"
            name="totalPrice"
            value={formData.totalPrice}
            onChange={handleInputChange}
            className={styles.totalPrice}
          />
         <h3>kip</h3>
        </div>
        <div className={styles.totalItem}>
          <label>Total Price (Thai): </label>
          <input
            type="number"
            name="totalPrices"
            value={formData.totalPrices}
            onChange={handleInputChange}
            className={styles.totalPrice}
            readOnly
          />
          <h3>baht</h3>
        </div>
      </div>

      <div className={styles.funcbtn}>
        <button type="submit" className={styles.savebutton}>
          <FontAwesomeIcon icon={faSave} /> {isEditing ? "Save Edit" : "Save"}
        </button>
        {isEditing && (
          <button onClick={resetForm} className={styles.cancelButton} type="button">
            <FontAwesomeIcon icon={faTimes} /> Cancel
          </button>
        )}
      </div>
    </form>
  );

  const renderEntries = () => (
    filteredEntries.map((entry, index) => (
      <div key={entry.id || index} className={styles.entryContainer}>
        <h4 className={styles.entryHeader}>
        Name: {highlightText(entry.userName, searchTerm)}
          </h4>
        <p>
        <p>Phone: {highlightText(entry.phoneNumber, searchTerm)}</p>
          </p>
        <table className={styles.entryTable}>
          <thead>
            <tr>
              <th>No</th>
              <th>Code</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {entry.codes.map((code, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td> {highlightText(code.code, searchTerm)}</td>
                <td>{code.price ? `${code.price} ฿` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.totalInfo}>
          <p>
            Total Price (Lao): {formatPrice(entry.totalPrice)} Kip | 
            Total Price (Thai): {formatPrice(entry.totalPrices)} Baht
          </p>
        </div>
        <div className={styles.actionbtn}>
          <div className={styles.leftButtons}>
            <button
              onClick={() => startEditing(entry)}
              className={`${styles.actionButton} ${styles.editButton}`}
            >
              <FontAwesomeIcon icon={faEdit} className={styles.icon} /> Edit
            </button>
            <button
              onClick={() => sendWhatsAppMessage(entry)}
              className={`${styles.actionButton} ${styles.whatsappButton}`}
            >
              <FontAwesomeIcon icon={faWhatsapp} className={styles.icon} /> Send to WhatsApp
            </button>
          </div>
          <div className={styles.rightButtons}>
            <button
              onClick={() => deleteEntry(entry.id)}
              className={`${styles.actionButton} ${styles.deleteButton}`}
            >
              <FontAwesomeIcon icon={faTrash} className={styles.icon} /> Delete
            </button>
          </div>
        </div>
      </div>
    ))
  );

  return (
    <div className={styles.container}>
        {renderNav()}
      {renderForm()}
      {renderEntries()}
    </div>
  );
};

export default AddThaiData;