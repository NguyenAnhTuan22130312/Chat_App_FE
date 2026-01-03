import React from 'react';
import LoginBanner from '../components/auth/LoginBanner';
import LoginForm from '../components/auth/LoginForm';

const Login: React.FC = () => {
  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <LoginBanner />
      <LoginForm />
    </div>
  );
};

export default Login;
