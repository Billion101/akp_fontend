import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/akp-logo.png';
import styles from './login.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'; 
import config from '../../config';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [errorMessage, setErrorMessage] = useState(''); 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${config.apiUrl}/auth/login`, { username, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      if (response.data.role === 'admin') {
        navigate('/home-admin');
      } else {
        navigate('/home-user');
      }
      setErrorMessage(''); 
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data || 'An error occurred. Please try again.'); 
      } else if (error.request) {
        setErrorMessage('Server did not respond. Please try again later.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
      console.error('Error logging in', error);
    }
  };

  const handleCheckCode = () => {
    navigate('/check-code');
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginForm}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="AKP Logistics" className={styles.logo} />
        </div>
        <h2 className={styles.title}>AKP SYSTEMS</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <FontAwesomeIcon icon={faUser} className={styles.icon} />
            <input
              type="text"
              placeholder="Username"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <FontAwesomeIcon icon={faLock} className={styles.icon} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.togglePassword}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className={styles.icon} />
            </button>
          </div>
          {errorMessage && (
            <p className={styles.errorMessage}>{errorMessage}</p>
          )}
          <div className={styles.buttonRow}>
            <button 
              onClick={handleCheckCode} 
              className={`${styles.submitButton} ${styles.checkCodeButton}`}
              type="button"
            >
              tracking code
            </button>
            <button type="submit" className={styles.submitButton}>
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
