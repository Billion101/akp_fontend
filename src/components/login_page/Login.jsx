import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/akp-logo.png';
import styles from './login.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'; // Import Font Awesome icons
import config from '../../config';
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [errorMessage, setErrorMessage] = useState(''); // State to handle error messages
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${config.apiUrl}auth/login`, { username, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      if (response.data.role === 'admin') {
        navigate('/home-admin');
      } else {
        navigate('/home-user');
      }
      setErrorMessage(''); // Clear any previous error message
    } catch (error) {
      setErrorMessage('Incorrect username or password'); // Set the error message
      console.error('Error logging in');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginContainer}>
        <img src={logo} alt="Logo" />
        <h2>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <label>Username:</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
          <label>Password:</label>
          <div className={styles.passwordContainer}>
            <input 
              type={showPassword ? 'text' : 'password'} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <span 
              className={styles.eyeIcon} 
              onClick={() => setShowPassword(!showPassword)}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </span>
          </div>
          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>} {/* Error message */}
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
