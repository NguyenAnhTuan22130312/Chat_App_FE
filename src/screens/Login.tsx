import React from 'react';
import LoginBanner from '../components/LoginBanner';
import LoginForm from '../components/LoginForm';

const Login: React.FC = () => {
  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <LoginBanner />
      <LoginForm />
    </div>
  );
};

export default Login;
