import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './screens/Login';
import Register from './screens/Register';
import ChatWindow from './components/chat/ChatWindow';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <div className="flex h-screen w-full overflow-hidden bg-white">
            <div className="w-[360px] h-full bg-gray-100 border-r border-gray-300 hidden md:flex items-center justify-center">
              <span className="text-gray-400 font-bold">
                Sidebar Area <br/> (Trung Han)
              </span>
            </div>
            <div className="flex-1 h-full">
              <ChatWindow />
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;