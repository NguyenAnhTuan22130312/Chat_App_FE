import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // User icon SVG
  const UserIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );

  // Lock icon SVG
  const LockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );

  // Eye icon SVG
  const EyeIcon = ({ isOpen }: { isOpen: boolean }) => (
    isOpen ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    )
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', { username, password });
  };

  return (
    <div className="w-1/2 h-screen flex items-center justify-center bg-gray-50 overflow-hidden">
      <form 
        onSubmit={handleSubmit} 
        className="w-[420px] bg-white rounded-2xl shadow-lg p-12 relative z-10 animate-fade-in-up"
      >
        <h1 className="text-[38px] font-semibold text-gray-900 mb-2 text-center">
          Chào Mừng Trở Lại
        </h1>
        <p className="text-[17px] text-gray-600 mb-9 text-center">
          Vui lòng đăng nhập vào tài khoản của bạn
        </p>
        
        {/* Username Field */}
        <div className="mb-5">
          <label className="block text-base font-medium text-gray-700 mb-2">
            Tên đăng nhập
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-gray-400 pointer-events-none z-10 flex items-center">
              <UserIcon />
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 pl-11 py-3.5 text-base text-gray-700 bg-white border-2 border-gray-300 rounded-lg outline-none transition-all duration-300 ease-in-out focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,132,255,0.1)]"
              placeholder="Nhập tên đăng nhập"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="mb-5">
          <label className="block text-base font-medium text-gray-700 mb-2">
            Mật khẩu
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-gray-400 pointer-events-none z-10 flex items-center">
              <LockIcon />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 pl-11 py-3.5 text-base text-gray-700 bg-white border-2 border-gray-300 rounded-lg outline-none transition-all duration-300 ease-in-out focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,132,255,0.1)]"
              placeholder="Nhập mật khẩu"
            />
            <span 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-gray-400 cursor-pointer transition-colors duration-200 z-10 flex items-center select-none hover:text-primary"
            >
              <EyeIcon isOpen={showPassword} />
            </span>
          </div>
        </div>

        {/* Forgot Password */}
        <div className="text-right mt-2 mb-7">
          <button 
            type="button"
            onClick={() => alert('Tính năng đang phát triển')}
            className="text-[15px] text-primary bg-transparent border-none cursor-pointer font-medium transition-opacity duration-200 hover:opacity-70 hover:underline p-0"
          >
            Quên mật khẩu?
          </button>
        </div>

        {/* Login Button */}
        <button 
          type="submit" 
          className="w-full py-4 text-[17px] font-semibold text-white bg-primary border-none rounded-lg cursor-pointer transition-all duration-300 ease-in-out mb-6 shadow-[0_4px_12px_rgba(0,132,255,0.25)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,132,255,0.4)] hover:bg-primary-light active:translate-y-0 active:shadow-[0_4px_12px_rgba(0,132,255,0.25)]"
        >
          Đăng nhập
        </button>

        {/* Sign Up Link */}
        <div className="text-center text-[15px] text-gray-600">
          Chưa có tài khoản? <Link to="/register" className="text-primary no-underline cursor-pointer font-semibold transition-opacity duration-200 hover:opacity-70 hover:underline">Đăng ký</Link>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
