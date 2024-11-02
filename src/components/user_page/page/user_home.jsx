import React, { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "../style/u_home.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faBell } from "@fortawesome/free-solid-svg-icons";
import UserHomeChainese from "./chainese_home";
import UserHomeThai from "./thai_home";

const UserHome = () => {
  const navigate = useNavigate();
  const [selectedForm, setSelectedForm] = useState("chainese");

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  }, [navigate]);

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
          <div className={styles.logo}>
            <FontAwesomeIcon icon={faUser} className={styles.logoIcon} />
          </div>
          <h2 className={styles.sidebarTitle}>User Page</h2>
        </div>

        <div className={styles.menu}>
          <Link to="/usernoti" className={styles.notificationLink}>
            ບິນຂອງຂ້ອຍ(ຈີນ)
            <FontAwesomeIcon icon={faBell} className={styles.icon} />
          </Link>
          <Link to="/usernoti-thai" className={styles.notificationLink}>
            ບິນຂອງຂ້ອຍ(ໄທ)
            <FontAwesomeIcon icon={faBell} className={styles.icon} />
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className={`${styles.button} ${styles.logoutButton}`}
        >
          Log Out
        </button>
      </aside>
      <main className={styles.mainContent}>
        {renderFormSwitcher()}
        {selectedForm === "chainese" ? <UserHomeChainese /> : <UserHomeThai />}
      </main>
    </div>
  );
};

export default UserHome;
