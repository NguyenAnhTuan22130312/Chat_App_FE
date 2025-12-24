import React, { useState } from 'react';
import { THEME } from '../constants/Theme';

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const containerStyle: React.CSSProperties = {
    width: '50%',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.loginFormBg,
    position: 'relative',
    overflow: 'hidden',
  };

  const formWrapperStyle: React.CSSProperties = {
    width: '400px',
    zIndex: 10,
    position: 'relative',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '48px',
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: '40px',
    textAlign: 'center',
  };

  const inputContainerStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: THEME.fontSize.medium,
    color: '#666',
    marginBottom: '8px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: THEME.fontSize.medium,
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  };

  const forgotPasswordStyle: React.CSSProperties = {
    textAlign: 'right',
    marginTop: '8px',
    marginBottom: '24px',
  };

  const linkStyle: React.CSSProperties = {
    fontSize: THEME.fontSize.small,
    color: THEME.colors.primary,
    textDecoration: 'none',
    cursor: 'pointer',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    fontSize: THEME.fontSize.large,
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: THEME.colors.loginBanner,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginBottom: '24px',
  };

  const createAccountStyle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: THEME.fontSize.medium,
    color: '#666',
  };

  const createCircleStyle = (
    size: number,
    top?: string,
    right?: string,
    opacity: number = 0.3
  ): React.CSSProperties => ({
    position: 'absolute',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: THEME.colors.loginAccent,
    top,
    right,
    opacity,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', { username, password });
  };

  return (
    <div style={containerStyle}>
      {/* Decorative circles */}
      <div style={createCircleStyle(60, '10%', '15%', 0.15)} />
      <div style={createCircleStyle(40, '80%', '10%', 0.2)} />
      <div style={createCircleStyle(80, '5%', '85%', 0.1)} />

      <div style={formWrapperStyle}>
        <h1 style={titleStyle}>Login</h1>
        
        <form onSubmit={handleSubmit}>
          <div style={inputContainerStyle}>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              placeholder=""
            />
          </div>

          <div style={inputContainerStyle}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder=""
            />
          </div>

          <div style={forgotPasswordStyle}>
            <a href="#" style={linkStyle}>forgot password?</a>
          </div>

          <button type="submit" style={buttonStyle}>
            Login
          </button>
        </form>

        <div style={createAccountStyle}>
          Don't have any account? <a href="#" style={{ ...linkStyle, fontWeight: 600 }}>Create an account</a>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
