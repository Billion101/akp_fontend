import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useParams,Link, useLocation} from "react-router-dom";
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

const AddChaineseData = () => {
  const { id: dayId } = useParams();
  const [formData, setFormData] = useState({
    userName: "",
    phoneNumber: "",
    codes: [{ code: "", weight: "", m3: "", color: "" }],
    totalPrice: "",
    totalWeight: "",
    totalM3: "",
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
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("client");
  const location = useLocation();
  const selectedDate = location.state?.date
    ? new Date(location.state.date).toLocaleDateString()
    : "N/A";
    const [searchTerm, setSearchTerm] = useState("");

  
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    const filtered = entries.filter(
      (entry) =>
        entry.userName.toLowerCase().includes(value) ||
        entry.phoneNumber.toLowerCase().includes(value) ||
        entry.codes.some((code) => code.code.toLowerCase().includes(value))
    );

    setFilteredEntries(filtered);
  };
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
        if (editingCell) {
          return;
        }
    
        // Prevent form submission when 'Enter' is pressed inside the table inputs
        if (e.key === "Enter") {
          e.preventDefault();
    
          // Check if the current field is 'code' to handle the row creation
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
        const fields = ["code", "weight", "m3", "color"];
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
            newField =
              fields[Math.min(fields.length - 1, fields.indexOf(currentField) + 1)];
            break;
        }
    
        inputRefs.current[newIndex]?.[newField]?.focus();
      };
    
      const fetchEntries = useCallback(() => {
        axios
          .get(`${config.apiUrl}/admin/getAdminEntries/${dayId}`, {
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
              codes: [
                ...prevState.codes,
                { code: "", weight: "", m3: "", color: "" },
              ],
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
        // Filter out duplicate codes based on the 'code' property
        const uniqueCodes = newCodes.filter(
          (code, index, self) =>
            index === self.findIndex((c) => c.code === code.code)
        );
    
        // Calculate total weight and total m3 from the unique codes
        const newTotalWeight = uniqueCodes.reduce(
          (sum, code) => sum + Number(code.weight || 0),
          0
        );
        const newTotalM3 = uniqueCodes.reduce(
          (sum, code) => sum + Number(code.m3 || 0),
          0
        );
    
        setFormData((prevState) => ({
          ...prevState,
          totalWeight: newTotalWeight.toFixed(2),
          totalM3: newTotalM3.toFixed(4),
        }));
      };
    
      const handleSubmit = (e) => {
        e.preventDefault();
      
        const uniqueCodes = formData.codes.reduce((acc, currentCode) => {
          const isDuplicate = acc.find((code) => code.code === currentCode.code);
          return isDuplicate ? acc : [...acc, currentCode];
        }, []);
      
        const dataToSend = {
          ...formData,
          codes: uniqueCodes,
          dayId,
          userId: selectedRole === "user" ? formData.userId : null,
          // Ensure the userName is set correctly based on role
          userName: selectedRole === "user" 
            ? users.find(u => u.id.toString() === formData.userId)?.username 
            : formData.userName
        };
      
        const url = isEditing
          ? `${config.apiUrl}/admin/updateAdminEntry/${editEntryId}`
          : `${config.apiUrl}/admin/addAdminEntry`;
        const method = isEditing ? "put" : "post";
      
        axios[method](
          url,
          dataToSend,
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
            codes: entry.codes.length > 0 
              ? entry.codes 
              : [{ code: "", weight: "", m3: "", color: "" }],
            totalPrice: entry.totalPrice,
            totalWeight: entry.totalWeight,
            totalM3: entry.totalM3,
            userId: matchingUser.id.toString()
          });
        } else {
          // If no matching user found, this is a client entry
          setSelectedRole("client");
          setFormData({
            userName: entry.userName,
            phoneNumber: entry.phoneNumber,
            codes: entry.codes.length > 0 
              ? entry.codes 
              : [{ code: "", weight: "", m3: "", color: "" }],
            totalPrice: entry.totalPrice,
            totalWeight: entry.totalWeight,
            totalM3: entry.totalM3,
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
          codes: [{ code: "", weight: "", m3: "", color: "" }],
          totalPrice: "",
          totalWeight: "",
          totalM3: "",
          userId: "",
        });
        setIsEditing(false);
        setEditEntryId(null);
      };
    
      const addNewRow = () => {
        if (isEditing) {
          setFormData((prevState) => ({
            ...prevState,
            codes: [
              ...prevState.codes,
              { code: "", weight: "", m3: "", color: "" },
            ],
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
            .delete(`${config.apiUrl}/admin/deleteAdminCode/${codeId}`, {
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
            .delete(`${config.apiUrl}/admin/deleteAdminEntry/${entryId}`, {
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
    
      const sortCodes = (codes) => {
        return [...codes].sort((a, b) => {
          if (a.weight && !b.weight) return -1;
          if (!a.weight && b.weight) return 1;
          if (a.m3 && !b.m3) return 1;
          if (!a.m3 && b.m3) return -1;
          return 0;
        });
      };
      const formatPrice = (price) => {
        if (!price) return "0.00 Kip";
        const formattedPrice = price
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `${formattedPrice} Kip`;
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
          const currentDate = `${today.getDate()}.${
            today.getMonth() + 1
          }.${today.getFullYear()}`;
          const sortedCodes = sortCodes(entry.codes);
          const totalItem = sortedCodes.length;
          const formattedCodes = sortedCodes
            .map((code, idx) => {
              const noPart = `${String(idx + 1).padStart(2)}`;
              const codePart = code.code.padEnd(16, "\u00A0"); 
              const weightPart = code.weight
                ? `${parseFloat(code.weight).toFixed(1).padStart(2)}kg`
                : "";
              const m3Part = code.m3
                ? `${parseFloat(code.m3).toFixed(4).padStart(2)}m³`
                : "";
    
              return `${noPart} ${codePart}${weightPart}${m3Part}`;
            })
            .join("\n");
    
          const totalPart = `Total: ${formatPrice(entry.totalPrice)} ${
            entry.totalWeight
          }kg ${entry.totalM3}m³`;
    
          if (role === "user1") {
            message = `
ມື້ນີ້ມີພັດສະດຸຂອງສາຂາເຂົ້າຮອດສາງເເລ້ວ
ສາມາດກວດສອບລະຫັດ ເເລະ ຄ່າຂົນສົ່ງຂອງວັນທີ
${currentDate} ໄດ້ຜ່ານ:
https://akplogistics.com
    `;
          } else {
            message = `\`\`\`
ມື້ນີ້ມີພັດສະດຸທ່ານເຂົ້າ ${totalItem} ລາຍການ
ສາມາດກວດສອບລະຫັດເເລະຄ່າຂົນສົ່ງຂອງວັນທີ
${currentDate} ໄດ້ດັ່ງຕໍ່ໄປນີ້:
ເຄື່ອງຈີນ:
${formattedCodes}
    
${totalPart}
                \`\`\``;
          }
    
          const phoneNumber = `+85620${entry.phoneNumber}`;
          window.open(
            `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
          );
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
        <form
          onSubmit={handleSubmit}
          className={styles.formContainer}
          ref={editBoxRef}
        >
          <h3>{isEditing ? "Edit Chaiese Entry" : "Add New Chainese Entry"}</h3>
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
                <th>Weight</th>
                <th>M3</th>
                <th>Color</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {formData.codes.map((code, index) => (
                <tr key={index}>
                  <td style={{ color: code.color || "black" }}>{index + 1}</td>
      
                  {/* Code Input */}
                  <td>
                    <input
                      ref={(el) => {
                        inputRefs.current[index] =
                          inputRefs.current[index] || {};
                        inputRefs.current[index].code = el;
                      }}
                      type="text"
                      value={code.code}
                      onChange={(e) =>
                        handleCodeChange(index, "code", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, index, "code")}
                      // onClick={() => handleCellClick(index, "code")}
                      style={{ color: code.color || "black" }}
                      className={styles.input}
                    />
                  </td>
      
                  {/* Weight Input */}
                  <td>
                    <input
                      ref={(el) => {
                        inputRefs.current[index] =
                          inputRefs.current[index] || {};
                        inputRefs.current[index].weight = el;
                      }}
                      type="text"
                      value={code.weight}
                      onChange={(e) =>
                        handleCodeChange(index, "weight", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, index, "weight")}
                      // onClick={() => handleCellClick(index, "weight")}
                      style={{ color: code.color || "black" }}
                      className={styles.input}
                    />
                  </td>
      
                  {/* M3 Input */}
                  <td>
                    <input
                      ref={(el) => {
                        inputRefs.current[index] =
                          inputRefs.current[index] || {};
                        inputRefs.current[index].m3 = el;
                      }}
                      type="text"
                      value={code.m3}
                      onChange={(e) =>
                        handleCodeChange(index, "m3", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, index, "m3")}
                      // onClick={() => handleCellClick(index, "m3")}
                      style={{ color: code.color || "black" }}
                      className={styles.input}
                    />
                  </td>
      
                  {/* Color Select */}
                  <td>
                    <select
                      ref={(el) => {
                        inputRefs.current[index] =
                          inputRefs.current[index] || {};
                        inputRefs.current[index].color = el;
                      }}
                      value={code.color}
                      onChange={(e) =>
                        handleCodeChange(index, "color", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, index, "color")}
                      // onClick={() => handleCellClick(index, "color")}
                      className={styles.input}
                    >
                      <option value="">Select Color</option>
                      <option value="red">Red</option>
                      <option value="blue">Blue</option>
                    </select>
                  </td>
      
                  {/* Delete Button */}
                  <td>
                    <button
                      onClick={() =>
                        code.id ? deleteCode(code.id) : deleteRow(index)
                      }
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
            <button
              onClick={addNewRow}
              className={styles.addButton}
              type="button"
            >
              <FontAwesomeIcon icon={faPlus} className={styles.icon} /> Add New
              Column
            </button>
          )}
      
          <div className={styles.totals}>
            <div className={styles.totalItem}>
              <label>Total Price: </label>
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
              <label>Total Weight: </label>
              <span>{formData.totalWeight}</span>
            </div>
            <div className={styles.totalItem}>
              <label>Total M3: </label>
              <span>{formData.totalM3}</span>
            </div>
          </div>
      
          <div className={styles.funcbtn}>
            <button type="submit" className={styles.savebutton}>
              <FontAwesomeIcon icon={faSave} /> {isEditing ? "Save Edit" : "Save"}
            </button>
            {isEditing && (
              <button
                onClick={resetForm}
                className={styles.cancelButton}
                type="button"
              >
                <FontAwesomeIcon icon={faTimes} />
                Cancel
              </button>
            )}
          </div>
        </form>
      );
      const renderEntries = () => (
        filteredEntries.map((entry, index) => (
            <div key={entry.id || index} className={styles.entryContainer}>
            <h4 className={styles.entryHeader}>Name: {entry.userName}</h4>
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
                    <td style={{ color: code.color || "black" }}>{index + 1}</td>
                    <td style={{ color: code.color || "black" }}>{code.code}</td>
                    <td style={{ color: code.color || "black" }}>
                      {code.weight ? `${code.weight} kg` : ""}
                    </td>
                    <td style={{ color: code.color || "black" }}>
                      {code.m3 ? `${code.m3} m³` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.totalInfo}>
              <p>
                Total Price: {formatPrice(entry.totalPrice)} | Total Weight:{" "}
                {entry.totalWeight} | Total M3: {entry.totalM3}
              </p>
            </div>
            <div className={styles.actionbtn}>
              <div className={styles.leftButtons}>
                <button
                  onClick={() => startEditing(entry)}
                  className={`${styles.actionButton} ${styles.editButton}`}
                >
                  <FontAwesomeIcon icon={faEdit} className={styles.icon} />
                  Edit
                </button>
                <button
                  onClick={() => sendWhatsAppMessage(entry)}
                  className={`${styles.actionButton} ${styles.whatsappButton}`}
                >
                  <FontAwesomeIcon icon={faWhatsapp} className={styles.icon} />
                  Send to WhatsApp
                </button>
              </div>
              <div className={styles.rightButtons}>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                >
                  <FontAwesomeIcon icon={faTrash} className={styles.icon} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      );

    return(
        <div className={styles.container}>
     {renderNav()}
        {renderForm()}
        {renderEntries()} 
  </div>
    );
};

export default AddChaineseData;