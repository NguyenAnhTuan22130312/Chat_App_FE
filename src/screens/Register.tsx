import React from 'react';
import RegisterBanner from '../components/auth/RegisterBanner';
import RegisterForm from '../components/auth/RegisterForm';

const Register: React.FC = () => {
  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <RegisterBanner />
      <RegisterForm />
    </div>
  );
};

export default Register;
