import React from 'react';
import { THEME } from '../../constants/Theme';

const LoginBanner: React.FC = () => {
  const bannerStyle: React.CSSProperties = {
    backgroundColor: THEME.colors.loginBanner,
    width: '50%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  };

  const textContainerStyle: React.CSSProperties = {
    color: THEME.colors.loginBannerText,
    textAlign: 'center',
    zIndex: 10,
    position: 'relative',
  };

  const helloTextStyle: React.CSSProperties = {
    fontSize: '48px',
    fontWeight: 400,
    margin: 0,
    marginBottom: '8px',
  };

  const mainTextStyle: React.CSSProperties = {
    fontSize: '64px',
    fontWeight: 400,
    margin: 0,
    lineHeight: 1.2,
  };

  const boldTextStyle: React.CSSProperties = {
    fontWeight: 700,
  };

  // Decorative circle styles
  const createCircleStyle = (
    size: number,
    top?: string,
    left?: string,
    bottom?: string,
    right?: string,
    opacity: number = 0.1,
    filled: boolean = false
  ): React.CSSProperties => ({
    position: 'absolute',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    border: filled ? 'none' : `2px solid ${THEME.colors.loginCircle}`,
    backgroundColor: filled ? THEME.colors.loginCircle : 'transparent',
    top,
    left,
    bottom,
    right,
    opacity,
  });

  // Semi-circle styles
  const createSemiCircleStyle = (
    size: number,
    top?: string,
    left?: string,
    bottom?: string,
    right?: string,
    rotation: number = 0
  ): React.CSSProperties => ({
    position: 'absolute',
    width: `${size}px`,
    height: `${size / 2}px`,
    border: `2px solid ${THEME.colors.loginCircle}`,
    borderBottom: 'none',
    borderRadius: `${size}px ${size}px 0 0`,
    top,
    left,
    bottom,
    right,
    transform: `rotate(${rotation}deg)`,
    opacity: 0.15,
  });

  // Diagonal line style
  const diagonalLineStyle: React.CSSProperties = {
    position: 'absolute',
    width: '400px',
    height: '1px',
    backgroundColor: THEME.colors.loginCircle,
    opacity: 0.2,
    transform: 'rotate(-45deg)',
    top: '30%',
    right: '-50px',
  };

  return (
    <div style={bannerStyle}>
      {/* Large circle top-left */}
      <div style={createCircleStyle(300, '-100px', '-100px', undefined, undefined, 0.08)} />
      
      {/* Large circle bottom-right */}
      <div style={createCircleStyle(350, undefined, undefined, '-150px', '-120px', 0.06)} />
      
      {/* Medium circles */}
      <div style={createCircleStyle(150, '20%', '10%', undefined, undefined, 0.12)} />
      <div style={createCircleStyle(120, undefined, undefined, '25%', '15%', 0.1)} />
      
      {/* Small filled circles */}
      <div style={createCircleStyle(12, '15%', '25%', undefined, undefined, 1, true)} />
      <div style={createCircleStyle(8, '45%', '15%', undefined, undefined, 0.8, true)} />
      <div style={createCircleStyle(15, '65%', undefined, undefined, '20%', 1, true)} />
      <div style={createCircleStyle(10, '80%', '30%', undefined, undefined, 0.9, true)} />
      
      {/* Semi-circles */}
      <div style={createSemiCircleStyle(200, '-50px', '-100px', undefined, undefined, 0)} />
      <div style={createSemiCircleStyle(180, undefined, undefined, '-40px', '-90px', 180)} />
      
      {/* Diagonal lines */}
      <div style={diagonalLineStyle} />
      <div style={{
        ...diagonalLineStyle,
        top: '60%',
        left: '-80px',
        right: 'auto',
        transform: 'rotate(45deg)',
      }} />

      {/* Text content */}
      <div style={textContainerStyle}>
        <h1 style={helloTextStyle}>Hello!</h1>
        <h2 style={mainTextStyle}>
          Have a<br />
          <span style={boldTextStyle}>GOOD DAY</span>
        </h2>
      </div>
    </div>
  );
};

export default LoginBanner;
