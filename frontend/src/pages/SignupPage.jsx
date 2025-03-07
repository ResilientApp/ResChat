import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../services/auth';

const SignupPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatarLocation, setAvatarLocation] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    console.log("Sending signup request to backend")
    const response = await signup(username, password, avatarLocation);
    console.log("Recieved response". response.message)
    if (response.result) {
      navigate('/login');
    } else {
      setError(response.message);
    }
  };

  return (
    <div>
      <h2>Signup</h2>
      <form onSubmit={handleSignup}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label>Avatar Location:</label>
          <input
            type="text"
            value={avatarLocation}
            onChange={(e) => setAvatarLocation(e.target.value)}
          />
        </div>
        {error && <p>{error}</p>}
        <button type="submit">Signup</button>
      </form>
    </div>
  );
};

export default SignupPage;