import React, { useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "../style/ad_home.module.css";
import config from "../../../config";
import logo from "../../../assets/akp-icon.jpg";
import HomeChainese from "./home_chainese";
import HomeThai from "./home_thai";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserEdit,faBullhorn } from "@fortawesome/free-solid-svg-icons";
const AdminHome = () => {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [selectedForm, setSelectedForm] = useState("chainese");
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  }, [navigate]);
  const handleManageUsersClick = (e) => {
    e.preventDefault();
    setShowPasswordModal(true);
  };

  const verifyAdminPassword = async () => {
    try {
      const response = await axios.post(
        `${config.apiUrl}/admin/verifyAdminPassword`,
        { password: adminPassword },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.isValid) {
        setShowPasswordModal(false);
        setAdminPassword("");
        navigate("/manage-users");
      } else {
        alert("Incorrect password. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      alert("An error occurred. Please try again.");
    }
  };
  const renderFormSwitcher = () => (
    <div className={styles.formSwitcher}>
      <button
        className={`${styles.switchButton} ${
          selectedForm === "chainese" ? styles.active : ""
        }`}
        onClick={() => setSelectedForm("chainese")}
      >
        Chinese bill
      </button>
      <button
        className={`${styles.switchButton} ${
          selectedForm === "thai" ? styles.active : ""
        }`}
        onClick={() => setSelectedForm("thai")}
      >
        Thai bill
      </button>
    </div>
  );

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
          <div className={styles.logoContainer}>
            <img src={logo} alt="AKP" className={styles.logo} />
            <h2 className={styles.title}>Admin Page</h2>
          </div>
          <div className={styles.menu}>
            <a
              href="/manage-users"
              onClick={handleManageUsersClick}
              className={styles.link}
            >
              Manage Users
              <FontAwesomeIcon icon={faUserEdit} className={styles.icon} />
            </a>
            <a 
            className={styles.link}
            >Promotion
             <FontAwesomeIcon icon={faBullhorn} className={styles.icon} />
            </a>
            
          </div>
          <button
              onClick={handleLogout}
              className={`${styles.button} ${styles.logoutButton}`}
            >
              Log Out
            </button>
      </aside>
      <div className={styles.mainContent}>
        {renderFormSwitcher()}
        {selectedForm === "chainese" ? <HomeChainese /> : <HomeThai />}
      </div>
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  verifyAdminPassword();
                }
              }}
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

export default AdminHome;
