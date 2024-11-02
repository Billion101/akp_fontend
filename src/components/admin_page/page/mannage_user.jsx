import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../style/ad_ma.module.css';
import config from '../../../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '' });
    const [editingUser, setEditingUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${config.apiUrl}/admin/getUser`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleAddUser = async () => {
        if (!newUser.username || !newUser.password) {
            alert('Please enter both a username and password.');
            return;
        }

        try {
            await axios.post(`${config.apiUrl}/admin/addUser`, newUser, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setNewUser({ username: '', password: '' });
            fetchUsers();
        } catch (error) {
            console.error('Error adding user:', error);
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                const response = await axios.delete(`${config.apiUrl}/admin/deleteUser/${id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (response.data.message) {
                    // Show success message to user
                    alert('User deleted successfully');
                    fetchUsers(); // Refresh the users list
                }
            } catch (error) {
                // Show error message to user
                alert('Error deleting user: ' + (error.response?.data?.details || error.message));
                console.error('Error deleting user:', error);
            }
        }
    };

    const handleEditUser = (user) => {
        setEditingUser({ ...user, newUsername: user.username, newPassword: '' });
    };

    const handleUpdateUser = async () => {
        if (!editingUser.newUsername) {
            alert('Username cannot be empty.');
            return;
        }

        try {
            await axios.put(`${config.apiUrl}/admin/updateUser/${editingUser.id}`, {
                username: editingUser.newUsername,
                password: editingUser.newPassword // Only send password if it's been changed
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/');
    };

    return (
        <div className = {styles.container}>
            <nav className={styles.navbar}>
                <Link to="/home-admin" className={styles.navLink}>
                <FontAwesomeIcon icon={faArrowLeft} />Back to Admin
                </Link>
                <button onClick={handleLogout} className={styles.logoutButton}>Log Out</button>
            </nav>

            <h2 className={styles.title}>Manage Users</h2>
            <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className={styles.inputField}
            />
            <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className={styles.inputField}
            />
            <button onClick={handleAddUser} className={styles.addButton}>Add User</button>

            <h3 className={styles.title}>Users List</h3>
           
<ul className={styles.usersList}>
    {users.map(user => (
        <li key={user.id} className={styles.userItem}>
            {editingUser && editingUser.id === user.id ? (
                <>
                    <input 
                        type="text" 
                        value={editingUser.newUsername} 
                        onChange={(e) => setEditingUser({...editingUser, newUsername: e.target.value})}
                        className={styles.editInput}
                    />
                    <input 
                        type="text" 
                        placeholder="New Password (optional)"
                        value={editingUser.newPassword} 
                        onChange={(e) => setEditingUser({...editingUser, newPassword: e.target.value})}
                        className={styles.editInput}
                    />
                    <div className={styles.userActions}>
                        <button onClick={handleUpdateUser} className={styles.saveButton}>Save</button>
                        <button onClick={() => setEditingUser(null)} className={styles.cancelButton}>Cancel</button>
                    </div>
                </>
            ) : (
                <>
                    {user.username} - {user.role}
                    <div className={styles.userActions}>
                        <button onClick={() => handleEditUser(user)} className={styles.editButton}>Edit</button>
                        <button onClick={() => handleDeleteUser(user.id)} className={styles.deleteButton}>Delete</button>
                    </div>
                </>
            )}
        </li>
    ))}
</ul>

        </div>
    );
}


export default ManageUsers;