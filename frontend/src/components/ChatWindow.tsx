import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaPaperPlane, FaMicrophone, FaVideo, FaPhone, FaEllipsisV } from 'react-icons/fa';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ChatName = styled.h4`
  margin: 0;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const Message = styled(motion.div)`
  margin-bottom: 1rem;
  display: flex;
  justify-content: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 0.5rem 1rem;
  border-radius: 18px;
  background: ${props => props.isOwn ? '#0088cc' : '#f0f0f0'};
  color: ${props => props.isOwn ? 'white' : 'black'};
`;

const InputContainer = styled.div`
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  margin-right: 0.5rem;
`;

const SendButton = styled.button`
  background: #0088cc;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

interface Message {
  _id: string;
  content: string;
  sender: any;
  createdAt: string;
}

interface Chat {
  _id: string;
  name?: string;
  participants: any[];
}

interface ChatWindowProps {
  chat: Chat;
  socket: any;
  onCallStart: (call: any) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat, socket, onCallStart }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [chat._id]);

  useEffect(() => {
    if (socket) {
      socket.on('message', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });
    }
  }, [socket]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/messages/${chat._id}`);
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to fetch messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await axios.post('/api/messages', {
        chatId: chat._id,
        content: newMessage
      });
      socket.emit('sendMessage', response.data);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message');
    }
  };

  const startCall = (type: 'voice' | 'video') => {
    // Implement call logic
    onCallStart({ type, chatId: chat._id });
  };

  return (
    <Container>
      <Header>
        <ChatName>{chat.name || 'Chat'}</ChatName>
        <div>
          <FaPhone onClick={() => startCall('voice')} style={{ cursor: 'pointer', marginRight: '1rem' }} />
          <FaVideo onClick={() => startCall('video')} style={{ cursor: 'pointer' }} />
        </div>
      </Header>
      <MessagesContainer>
        {messages.map(message => (
          <Message key={message._id} isOwn={message.sender._id === 'currentUserId'}>
            <MessageBubble isOwn={message.sender._id === 'currentUserId'}>
              {message.content}
            </MessageBubble>
          </Message>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <InputContainer>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <SendButton onClick={sendMessage}>
          <FaPaperPlane />
        </SendButton>
      </InputContainer>
    </Container>
  );
};

export default ChatWindow;