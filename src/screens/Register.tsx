import React from 'react';
import RegisterBanner from '../components/RegisterBanner';
import RegisterForm from '../components/RegisterForm';

const Register: React.FC = () => {
  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <RegisterBanner />
      <RegisterForm />
    </div>
  );
};

export default Register;
