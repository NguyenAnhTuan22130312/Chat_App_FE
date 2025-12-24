import React from 'react';
import LoginBanner from '../components/LoginBanner';
import LoginForm from '../components/LoginForm';
import '../styles/Login.css';

const Login: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
  };

  return (
    <div style={containerStyle} className="login-container">
      <LoginBanner />
      <LoginForm />
    </div>
  );
};

export default Login;
