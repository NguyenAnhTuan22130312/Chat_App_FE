import React from 'react';
import LoginBanner from './LoginBanner';
import './Login.css';

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
    </div>
  );
};

export default Login;
