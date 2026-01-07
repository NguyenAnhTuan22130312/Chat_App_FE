import React from 'react';

const RegisterBanner: React.FC = () => {
  const Dot = ({ top, left, delay }: { top: string; left: string; delay: number }) => (
    <div 
      className="absolute w-1.5 h-1.5 rounded-full bg-white/60 animate-float-particle"
      style={{ top, left, animationDelay: `${delay}s` }}
    />
  );

  return (
    <div className="relative w-1/2 h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-400 to-primary overflow-hidden">
      <div className="absolute w-[300px] h-[300px] rounded-full border-2 border-white/20 -top-[100px] -left-[100px] opacity-10" />
      <div className="absolute w-[250px] h-[250px] rounded-full border-2 border-white/20 -bottom-[80px] -right-[80px] opacity-12" />
      <div className="absolute w-[180px] h-[180px] rounded-full border-2 border-white/20 top-[20%] left-[10%] opacity-8" />
      <div className="absolute w-[200px] h-[200px] rounded-full border-2 border-white/20 bottom-[25%] right-[15%] opacity-9" />
      
      <Dot top="25%" left="20%" delay={0} />
      <Dot top="45%" left="80%" delay={1} />
      <Dot top="65%" left="15%" delay={2} />
      <Dot top="75%" left="70%" delay={1.5} />

      <div className="relative text-center z-10 max-w-[500px] px-10">
        <h1 className="text-[56px] font-semibold text-white m-0 mb-4 tracking-tight">
          Chào Mừng Bạn!
        </h1>
        <p className="text-xl text-white/95 m-0 leading-relaxed">
          Tạo tài khoản để trải nghiệm đầy đủ các tính năng của chúng tôi
        </p>
      </div>
    </div>
  );
};

export default RegisterBanner;
