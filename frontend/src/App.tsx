import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import { motion } from 'framer-motion';
import io from 'socket.io-client';
import axios from 'axios';

// Components
import Login from './components/Login';
import Register from './components/Register';
import VerifyEmail from './components/VerifyEmail';
import ResetPassword from './components/ResetPassword';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import CallWindow from './components/CallWindow';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from './contexts/ThemeContext';

// Styles
const AppContainer = styled.div<{ theme: any }>`
  height: 100vh;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  display: flex;
`;

const Sidebar = styled.div<{ theme: any }>`
  width: 300px;
  background: ${props => props.theme.sidebar};
  border-right: 1px solid ${props => props.theme.border};
`;

const MainArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const lightTheme = {
  background: '#ffffff',
  sidebar: '#f8f9fa',
  text: '#000000',
  border: '#e0e0e0',
  primary: '#0088cc',
  secondary: '#f0f0f0'
};

const darkTheme = {
  background: '#1e1e1e',
  sidebar: '#2d2d2d',
  text: '#ffffff',
  border: '#404040',
  primary: '#0088cc',
  secondary: '#3d3d3d'
};

const AppContent: React.FC = () => {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [socket, setSocket] = useState<any>(null);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [activeCall, setActiveCall] = useState<any>(null);

  useEffect(() => {
    if (token) {
      const newSocket = io('http://localhost:5000', {
        auth: { token }
      });
      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token]);

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <AppContainer theme={theme === 'light' ? lightTheme : darkTheme}>
      <Sidebar theme={theme === 'light' ? lightTheme : darkTheme}>
        <ChatList onSelectChat={setSelectedChat} />
      </Sidebar>
      <MainArea>
        {selectedChat && (
          <ChatWindow
            chat={selectedChat}
            socket={socket}
            onCallStart={setActiveCall}
          />
        )}
      </MainArea>
      {activeCall && (
        <CallWindow
          call={activeCall}
          onEnd={() => setActiveCall(null)}
        />
      )}
    </AppContainer>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CustomThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </CustomThemeProvider>
    </AuthProvider>
  );
};

export default App;